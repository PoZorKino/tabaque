import { Channel } from "@spacebar/database";
import { WebSocket, Payload, OPCODES, Send, handleOffloadedGatewayRequest } from "@spacebar/gateway";
import { Not, IsNull } from "typeorm";
import { Config } from "@spacebar/util";

export async function onRequestChannelStatuses(this: WebSocket, { d }: Payload) {
    // Schema validation can only accept either string or array, so transforming it here to support both
    if (!d.guild_id) throw new Error('"guild_id" is required');

    if (Config.get().offload.gateway.channelStatusesUrl !== null) {
        if (await handleOffloadedGatewayRequest(this, Config.get().offload.gateway.channelStatusesUrl!, d)) return;
    }

    const channels = await Channel.find({
        where: { guild_id: d.guild_id, status: Not(IsNull()) },
        select: { id: true, status: true },
    });
    await Send(this, {
        op: OPCODES.Dispatch,
        t: "CHANNEL_STATUSES",
        d: {
            guild_id: d.guild_id,
            channels: channels.map((channel) => ({ id: channel.id, status: channel.status })),
        },
    });
}
