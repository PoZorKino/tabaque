import { Member } from "@spacebar/database";
import { Request, Response, Router } from "express";
import { route } from "@spacebar/api/middlewares";
import { getSearchableChannels, searchMessages, searchResponse, searchTabs } from "@spacebar/api/util";

const router: Router = Router({ mergeParams: true });

// everything the user can read, DMs and every server, in one search
router.get("/", route({ responses: { 200: {} } }), async (req: Request, res: Response) => {
    // DMs, plus the channels this user can read in every server they are in
    const memberships = await Member.find({ where: { id: req.user_id }, select: { guild_id: true } });
    const lists = await Promise.all([getSearchableChannels(req.user_id, undefined, []), ...memberships.map((m) => getSearchableChannels(req.user_id, m.guild_id, []))]);
    const channels = [...new Map(lists.flat().map((channel) => [channel.id, channel])).values()];
    // "In": limit the search to the chosen channels or DMs
    const only = [req.query.channel_id].flat().filter((id): id is string => typeof id === "string" && id.length > 0);
    const scoped = only.length ? channels.filter((channel) => only.includes(channel.id)) : channels;
    res.json(searchResponse(req.user_id, await searchMessages(req.user_id, scoped, { include_nsfw: true, ...req.query })));
});

router.post(
    "/tabs",
    route({
        responses: {
            200: {},
        },
    }),
    async (req: Request, res: Response) => {
        const ids = req.body.channel_ids === undefined ? [] : (Array.isArray(req.body.channel_ids) ? req.body.channel_ids : [req.body.channel_ids]).map(String);
        const channels = await getSearchableChannels(req.user_id, undefined, ids);
        res.json(await searchTabs(req.user_id, channels, { include_nsfw: true, ...req.body }));
    },
);

export default router;
