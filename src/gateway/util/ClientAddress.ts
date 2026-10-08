import type { IncomingMessage } from "node:http";

export const clientAddress = (request: IncomingMessage, forwardedFor: string | null) => {
    const forwarded = forwardedFor ? request.headers[forwardedFor.toLowerCase()] : undefined;
    return (typeof forwarded === "string" ? forwarded.trim() : undefined) || request.socket.remoteAddress;
};
