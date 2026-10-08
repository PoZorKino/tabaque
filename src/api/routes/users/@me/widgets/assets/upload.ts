import crypto from "node:crypto";
import { Request, Response, Router } from "express";
import { HTTPError } from "lambert-server/HTTPError";
import { route } from "@spacebar/api/middlewares";
import { Config, WIDGET_UPLOAD_MAX_BYTES, WIDGET_UPLOAD_TTL_MS, signWidgetUpload } from "@spacebar/util";

const router: Router = Router({ mergeParams: true });

// step one of a widget image upload: hands out a short-lived, signed CDN URL for the client to PUT the file to
router.post("/", route({ responses: { 200: {}, 400: { body: "APIErrorResponse" } } }), async (req: Request, res: Response) => {
    const { filename, file_size } = (req.body ?? {}) as { filename?: unknown; file_size?: unknown };
    if (typeof file_size !== "number" || !Number.isSafeInteger(file_size) || file_size < 1) throw new HTTPError("Invalid file size", 400);
    if (file_size > WIDGET_UPLOAD_MAX_BYTES) throw new HTTPError("Request entity too large", 413);
    const safeName =
        (typeof filename === "string" ? filename : "")
            .replaceAll(" ", "_")
            .replace(/[^a-zA-Z0-9._-]+/g, "")
            .slice(0, 100) || "image";

    const cdn = Config.get().cdn.endpointPublic?.replace(/\/+$/, "");
    if (!cdn) throw new HTTPError("Uploads are unavailable", 503);
    const token = crypto.randomBytes(16).toString("hex");
    const exp = Date.now() + WIDGET_UPLOAD_TTL_MS;
    const sig = signWidgetUpload(req.user_id, token, exp);

    res.json({
        upload_url: `${cdn}/widget-assets/upload/${req.user_id}/${token}/${encodeURIComponent(safeName)}?exp=${exp}&sig=${sig}`,
        upload_filename: `${req.user_id}/${token}`,
    });
});

export default router;
