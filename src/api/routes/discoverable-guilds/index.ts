import { Request, Response, Router } from "express";
import { ArrayContains, In, Not } from "typeorm";
import { route } from "@spacebar/api/middlewares";
import { Guild } from "@spacebar/database";
import { Config } from "@spacebar/util";
import { discoveryCategories, discoveryPage, hiddenDiscoveryGuildIds, toDiscoveryList } from "@spacebar/api/util/handlers/Discovery";

const router = Router({ mergeParams: true });

router.get(
    "/",
    route({
        responses: {
            200: {
                body: "DiscoverableGuildsResponse",
            },
        },
    }),
    async (req: Request, res: Response) => {
        const { offset, limit } = discoveryPage(req.query);
        const categories = discoveryCategories(req.query.categories);
        const hidden = await hiddenDiscoveryGuildIds(req.user_id);

        const [guilds, total] = await Guild.findAndCount({
            where: {
                ...(hidden.length ? { id: Not(In(hidden)) } : {}),
                discovery_excluded: false,
                ...(categories.length ? { primary_category_id: In(categories) } : {}),
                ...(Config.get().guild.discovery.showAllGuilds ? {} : { features: ArrayContains(["DISCOVERABLE"]) }),
            },
            order: { discovery_weight: "DESC", member_count: "DESC", id: "ASC" },
            skip: offset,
            take: limit,
        });

        res.send({ total, guilds: await toDiscoveryList(guilds), offset, limit });
    },
);

export default router;
