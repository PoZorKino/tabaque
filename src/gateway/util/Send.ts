import { Payload, WebSocket } from "@spacebar/gateway";
import fs from "node:fs/promises";
import path from "node:path";

import { JSONReplacer, JSONStringify } from "@spacebar/util";
import { boundedDispatchPush, bufferForResume, rememberDispatch, resolveSocket } from "./SessionResume";
import { filterBotDispatch } from "./GatewayIntents";
import * as erlpack from "harmony-erlpack";

// don't care
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const recurseJsonReplace = (json: any) => {
    for (const key in json) {
        // eslint-disable-next-line no-prototype-builtins
        if (!Object.hasOwn(json, key)) continue;

        json[key] = JSONReplacer.call(json, key, json[key]);

        if (typeof json[key] == "object" && json[key] !== null) json[key] = recurseJsonReplace(json[key]);
    }
    return json;
};

export async function Send(target: WebSocket, data: Payload, guildId?: string) {
    const socket = resolveSocket(target);
    const filtered = filterBotDispatch(socket, data, guildId);
    if (!filtered) return;
    data = filtered;
    if (socket.pendingDispatches && data.op === 0 && data.t !== "READY" && data.t !== "READY_SUPPLEMENTAL" && data.t !== "GUILD_CREATE") {
        if (!boundedDispatchPush(socket.pendingDispatches, data, 1000, 8 * 1024 * 1024)) {
            socket.pendingDispatches = undefined;
            socket.close(4008, "Pending dispatch limit exceeded");
        }
        return;
    }
    if (socket.readyState !== 1 && data.op === 0 && bufferForResume(socket, data)) return;
    rememberDispatch(socket, data);
    if (process.env.WS_VERBOSE) console.log(`[Websocket] Outgoing message: ${JSON.stringify(data)}`);

    if (process.env.WS_DUMP) {
        const id = socket.session_id || "unknown";

        await fs.mkdir(path.join("dump", id), {
            recursive: true,
        });
        await fs.writeFile(path.join("dump", id, `${Date.now()}.out.json`), JSON.stringify(data, null, 2));
    }

    let buffer: Buffer | string;
    if (socket.encoding === "etf" && erlpack) {
        // Erlpack doesn't like Date objects, encodes them as {}
        data = recurseJsonReplace(data);
        buffer = Buffer.from(erlpack.pack(data));
    }
    // TODO: encode circular object
    else if (socket.encoding === "json") buffer = JSONStringify(data);
    else return;

    // TODO: compression
    if (socket.compress === "zlib-stream") {
        buffer = socket.deflate!.process(buffer) as Buffer;
    } else if (socket.compress === "zstd-stream") {
        if (typeof buffer === "string") buffer = Buffer.from(buffer as string);

        buffer = socket.zstdEncoder!.encodeSync(buffer as Buffer);
    }

    return new Promise((res) => {
        if (socket.readyState === 1 && socket.bufferedAmount + (typeof buffer === "string" ? Buffer.byteLength(buffer) : buffer.byteLength) > 32 * 1024 * 1024) {
            socket.close(4008, "Outgoing dispatch limit exceeded");
            res(null);
        } else if (socket.readyState === 1) socket.send(buffer, () => res(null));
        else {
            socket.close();
            res(null);
        }
    });
}
