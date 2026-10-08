import crypto from "node:crypto";
import { Config } from "./Config";

// profile widget images go client -> CDN with a plain PUT that carries no token, so the upload URL itself is the credential
export const WIDGET_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
export const WIDGET_UPLOAD_TTL_MS = 15 * 60 * 1000;

const mac = (userId: string, token: string, exp: number) =>
    crypto.createHmac("sha256", Config.get().security.requestSignature).update(`widget-upload|${userId}|${token}|${exp}`).digest("base64url");

export function signWidgetUpload(userId: string, token: string, exp: number) {
    return mac(userId, token, exp);
}

export function verifyWidgetUpload(userId: string, token: string, exp: unknown, sig: unknown) {
    const expiry = typeof exp === "string" && /^\d{1,15}$/.test(exp) ? Number(exp) : NaN;
    if (!Number.isFinite(expiry) || expiry < Date.now() || typeof sig !== "string") return false;
    const want = Buffer.from(mac(userId, token, expiry));
    const got = Buffer.from(sig);
    return want.length === got.length && crypto.timingSafeEqual(want, got);
}
