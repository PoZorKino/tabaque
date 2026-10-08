import { Config, corsProxyUrl, extractVideoFrame, verifyExternalPath } from "@spacebar/util";
import { Request, Response } from "express";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

const MAX_SIZE = 50 * 1024 * 1024;
const PASSTHROUGH_HEADERS = ["content-type", "content-length", "content-range", "accept-ranges", "last-modified", "etag"];

let active = 0;

export async function ExternalProxy(req: Request, res: Response) {
    if (active >= 32) return res.status(503).send("Media proxy is busy");
    active++;
    try {
        return await serveExternalProxy(req, res);
    } finally {
        active--;
    }
}

async function serveExternalProxy(req: Request, res: Response) {
    const [, , hash, ...rest] = req.originalUrl.split("?")[0].split("/");
    const path = rest.join("/");
    if (!hash || !verifyExternalPath(hash, path)) return res.status(403).send("Invalid signature");

    const search = rest[0]?.startsWith("%3F") ? decodeURIComponent(rest.shift()!) : "";
    const [protocol, ...location] = rest;
    if (protocol !== "https" && protocol !== "http") return res.status(400).send("Invalid protocol");

    let target: string;
    try {
        target = corsProxyUrl(new URL(`${protocol}://${location.join("/")}${search}`));
    } catch {
        return res.status(400).send("Invalid media URL");
    }
    if (req.query.format) {
        const head = await fetch(target, {
            method: "HEAD",
            redirect: "error",
            signal: AbortSignal.timeout(10000),
        }).catch(() => null);
        if (head?.headers.get("content-type")?.startsWith("video/")) {
            const frame = await extractVideoFrame(target);
            if (!frame) return res.status(415).send("Unable to render a preview frame");
            res.setHeader("content-type", "image/jpeg");
            res.setHeader("cache-control", `public, max-age=${Config.get().cdn.proxyCacheHeaderSeconds}`);
            res.setHeader("access-control-allow-origin", "*");
            res.setHeader("cross-origin-resource-policy", "cross-origin");
            return res.send(frame);
        }
    }

    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), 15000);
    const disconnected = () => {
        if (!res.writableEnded) abort.abort();
    };
    res.once("close", disconnected);
    let upstream: globalThis.Response | undefined;
    try {
        upstream = await fetch(target, {
            redirect: "error",
            headers: {
                "user-agent": Config.get().embeds.defaultUserAgent ?? "Mozilla/5.0",
                ...(req.headers.range && { range: req.headers.range }),
            },
            signal: abort.signal,
        });
        if (!upstream.body) return res.status(502).send("Unable to reach media proxy");
        if (!upstream.ok) return res.status(upstream.status).send(`Media proxy responded with ${upstream.status}`);
        const length = upstream.headers.get("content-length");
        if (length && (!/^\d+$/.test(length) || !Number.isSafeInteger(Number(length)) || Number(length) > MAX_SIZE)) return res.status(413).send("Media response too large");
        const type = upstream.headers.get("content-type") ?? "";
        if (!/^(image|video|audio)\//.test(type)) return res.status(415).send("Unsupported media type");
        res.status(upstream.status);
        for (const header of PASSTHROUGH_HEADERS) {
            const value = upstream.headers.get(header);
            if (value) res.setHeader(header, value);
        }
        res.setHeader("cache-control", `public, max-age=${Config.get().cdn.proxyCacheHeaderSeconds}`);
        res.setHeader("access-control-allow-origin", "*");
        res.setHeader("cross-origin-resource-policy", "cross-origin");
        let bytes = 0;
        const bounded = new Transform({
            transform(chunk, _encoding, callback) {
                bytes += chunk.length;
                callback(bytes > MAX_SIZE ? new Error("Media response exceeds byte limit") : null, chunk);
            },
        });
        await pipeline(Readable.fromWeb(upstream.body as import("node:stream/web").ReadableStream), bounded, res, { signal: abort.signal });
    } catch {
        if (res.headersSent) res.destroy();
        else res.status(502).send("Unable to reach media proxy");
    } finally {
        clearTimeout(timeout);
        res.off("close", disconnected);
        abort.abort();
        if (upstream?.body && !upstream.body.locked) await upstream.body.cancel().catch(() => {});
    }
}
