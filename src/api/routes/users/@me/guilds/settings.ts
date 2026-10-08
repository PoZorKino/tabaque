import { Request, Response, Router } from "express";
import { route } from "@spacebar/api/middlewares";
import { Member } from "@spacebar/database";
import { UserGuildSettings } from "@spacebar/schemas";

const router = Router({ mergeParams: true });

router.patch("/", route({}), async (req: Request, res: Response) => {
    const { guilds } = req.body as { guilds?: Record<string, Partial<UserGuildSettings>> };

    const entries = await Promise.all(
        Object.entries(guilds ?? {}).map(([guild_id, settings]) => Member.updateGuildSettings(req.user_id, guild_id === "null" || guild_id === "@me" ? null : guild_id, settings)),
    );

    res.json(entries);
});

export default router;
