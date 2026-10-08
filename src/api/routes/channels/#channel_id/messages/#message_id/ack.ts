import { Request, Response, Router } from "express";
import { route } from "@spacebar/api/middlewares";
import { GuildInsights, ReadState } from "@spacebar/database";
import { emitEvent, getPermission, MessageAckEvent } from "@spacebar/util";
import { MessageAcknowledgeSchema } from "@spacebar/schemas";

const router = Router({ mergeParams: true });

// TODO: public read receipts & privacy scoping
// TODO: send read state event to all channel members
// TODO: advance-only notification cursor

router.post(
    "/",
    route({
        requestBody: "MessageAcknowledgeSchema",
        responses: {
            200: {},
            403: {},
        },
    }),
    async (req: Request, res: Response) => {
        const { channel_id, message_id } = req.params as { [key: string]: string };

        const permission = await getPermission(req.user_id, undefined, channel_id);
        permission.hasThrow("VIEW_CHANNEL");
        GuildInsights.visit(channel_id, req.user_id);

        const body = req.body as MessageAcknowledgeSchema;
        let read_state = await ReadState.findOne({
            where: { user_id: req.user_id, channel_id },
        });
        if (!read_state) read_state = ReadState.create({ user_id: req.user_id, channel_id });
        read_state.last_message_id = message_id;
        read_state.mention_count = body.manual ? Math.max(0, body.mention_count ?? 0) : 0;
        if (body.flags !== undefined) read_state.flags = body.flags as typeof read_state.flags;

        await read_state.save();

        await emitEvent({
            event: "MESSAGE_ACK",
            user_id: req.user_id,
            data: {
                channel_id,
                message_id,
                version: Date.now(),
                ...(body.manual && { manual: true, mention_count: read_state.mention_count }),
            },
        } satisfies MessageAckEvent);

        res.json({ token: null });
    },
);

export default router;
