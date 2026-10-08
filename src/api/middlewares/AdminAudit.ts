import { NextFunction, Request, Response } from "express";
import { AdminAuditLog } from "@spacebar/database";
import { Snowflake } from "@spacebar/util";

const WRITES = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const ADMIN_PATH = /^\/api(?:\/v\d+)?\/admin\/([^/?]+)(.*)$/;
const SECRET_KEY = /pass|token|secret|key|hash|totp|code|cookie/i;

// request bodies are kept for the trail, minus anything secret and without large blobs such as uploaded images
export function redactBody(value: unknown, depth = 0): unknown {
    if (value === null || typeof value !== "object") return typeof value === "string" && value.length > 300 ? `[${value.length} characters]` : value;
    if (depth >= 4) return "[nested]";
    if (Array.isArray(value)) return value.slice(0, 20).map((item) => redactBody(item, depth + 1));
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, SECRET_KEY.test(key) ? "[redacted]" : redactBody(item, depth + 1)]));
}

// records every successful write to /admin once the response has been sent
export function AdminAudit(req: Request, res: Response, next: NextFunction) {
    const match = WRITES.has(req.method) ? ADMIN_PATH.exec(req.path) : null;
    if (!match) return next();
    // taken now: routers rewrite req.path while they handle the request
    const path = req.path.replace(/^\/api(?:\/v\d+)?/, "");
    res.on("finish", () => {
        if (res.statusCode < 200 || res.statusCode >= 300 || !req.user_id) return;
        const target = /\/(\d{5,})/.exec(match[2]);
        AdminAuditLog.save(
            AdminAuditLog.create({
                id: Snowflake.generate(),
                actor_id: req.user_id,
                method: req.method,
                path,
                area: match[1],
                target_id: target?.[1] ?? null,
                status: res.statusCode,
                body: req.body && typeof req.body === "object" ? (redactBody(req.body) as Record<string, unknown>) : null,
                created_at: new Date(),
            }),
        ).catch((e) => console.error("[Audit] couldn't record an admin action", e));
    });
    next();
}
