import crypto from "node:crypto";
import { Router, Request, Response, raw } from "express";
import { fileTypeFromBuffer } from "file-type";
import imageSize from "image-size";
import { HTTPError } from "lambert-server/HTTPError";
import { Config, WIDGET_UPLOAD_MAX_BYTES, verifyWidgetUpload } from "@spacebar/util";
import { storage, setCacheControl, setCacheControlNotFound } from "../util";

const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp", "image/avif", "image/gif"];
const ID = /^\d{1,32}$/;
const TOKEN = /^[0-9a-f]{32}$/;

// gif is always treated as animated; apng and webp carry an animation marker chunk near the start
const isAnimated = (buffer: Buffer, mime: string) =>
    mime === "image/gif" || (mime === "image/png" && buffer.subarray(0, 4096).includes("acTL")) || (mime === "image/webp" && buffer.subarray(0, 64).includes("ANIM"));

const router = Router({ mergeParams: true });

// the file waits here until the widgets save claims it
router.put("/upload/:user_id/:token/:filename", raw({ type: () => true, limit: WIDGET_UPLOAD_MAX_BYTES }), async (req: Request, res: Response) => {
    const { user_id, token } = req.params as { [key: string]: string };
    if (!ID.test(user_id) || !TOKEN.test(token) || !verifyWidgetUpload(user_id, token, req.query.exp, req.query.sig)) throw new HTTPError("Invalid or expired upload URL", 403);
    if (!Buffer.isBuffer(req.body) || !req.body.length) throw new HTTPError("Missing file", 400);
    await storage.set(`widget-pending/${user_id}/${token}`, req.body);
    res.status(200).end();
});

// internal, called by the API when the widgets are saved
router.post("/finalize/:user_id/:token", async (req: Request, res: Response) => {
    if (req.headers.signature !== Config.get().security.requestSignature) throw new HTTPError("Invalid request signature");
    const { user_id, token } = req.params as { [key: string]: string };
    if (!ID.test(user_id) || !TOKEN.test(token)) throw new HTTPError("Invalid upload", 400);
    const pending = `widget-pending/${user_id}/${token}`;
    const buffer = await storage.get(pending);
    if (!buffer) throw new HTTPError("Upload not found", 404);

    const type = await fileTypeFromBuffer(buffer);
    if (!type || !ALLOWED_MIME_TYPES.includes(type.mime)) {
        await storage.delete(pending);
        throw new HTTPError("Invalid file type", 400);
    }
    let width = 0;
    let height = 0;
    try {
        const size = imageSize(buffer);
        width = size.width ?? 0;
        height = size.height ?? 0;
    } catch {
        await storage.delete(pending);
        throw new HTTPError("Unreadable image", 400);
    }

    const hash = crypto.createHash("md5").update(buffer).digest("hex");
    await storage.set(`widget-assets/${user_id}/${hash}`, buffer);
    await storage.delete(pending);
    res.json({ file_id: hash, width, height, is_animated: isAnimated(buffer, type.mime) });
});

// the client appends ?format=&animated=; the original is served as is
router.get("/:user_id/:hash", setCacheControl, async (req: Request, res: Response) => {
    const { user_id, hash } = req.params as { [key: string]: string };
    if (!ID.test(user_id) || !/^[0-9a-f]{32}$/.test(hash)) return setCacheControlNotFound(req, res);
    const file = await storage.get(`widget-assets/${user_id}/${hash}`);
    if (!file) return setCacheControlNotFound(req, res);
    const type = await fileTypeFromBuffer(file);
    res.set("Content-Type", type?.mime ?? "application/octet-stream");
    return res.send(file);
});

export default router;
