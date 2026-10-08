import { HTTPError } from "lambert-server/HTTPError";
import { Request, Response, Router } from "express";
import { route } from "@spacebar/api/middlewares";
import { ADMIN_PANEL_RIGHTS } from "@spacebar/api/util";
import { brandImageUrls, Config, getRevInfoOrFail, instanceName } from "@spacebar/util";
import { adminCounts, ADMIN_COUNTS_TTL_MS } from "@spacebar/api/util/utility/adminCounts";

const router = Router({ mergeParams: true });
const revision = getRevInfoOrFail();

router.get(
    "/",
    route({
        spacebarOnly: true,
        description: "Instance overview for the admin dashboard, including which admin areas the caller can access",
    }),
    async (req: Request, res: Response) => {
        const rights = req.rights;
        if (!rights.any([...ADMIN_PANEL_RIGHTS])) throw new HTTPError("This account does not have admin access", 403);

        const counts = await adminCounts();

        const { general } = Config.get();
        res.json({
            instance: {
                id: general.instanceId,
                name: instanceName(),
                description: general.instanceDescription,
                image: brandImageUrls().icon ?? general.image,
            },
            counts: counts.value,
            counts_sampled_at: counts.sampled_at,
            counts_refresh_seconds: ADMIN_COUNTS_TTL_MS / 1000,
            uptime: process.uptime(),
            revision,
            access: {
                operator: rights.has("OPERATOR"),
                settings: rights.has("OPERATOR"),
                status: rights.has("OPERATOR"),
                users: rights.has("MANAGE_USERS"),
                guilds: rights.has("MANAGE_GUILDS"),
                reports: rights.has("MANAGE_USERS"),
                messages: rights.has("MANAGE_MESSAGES"),
                system: rights.has("OPERATOR"),
            },
        });
    },
);

export default router;
