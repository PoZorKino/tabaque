import { Request, Response, Router } from "express";
import { HTTPError } from "lambert-server/HTTPError";
import { route } from "@spacebar/api/middlewares";
import { AdminAuditLog, User } from "@spacebar/database";
import { In } from "typeorm";

const router = Router({ mergeParams: true });

router.get("/", route({ right: "OPERATOR", spacebarOnly: true, description: "Who changed what in the admin dashboard" }), async (req: Request, res: Response) => {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const { before, actor, area, target } = req.query as Record<string, string | undefined>;
    for (const [name, value] of Object.entries({ before, actor, target })) if (value !== undefined && !/^\d{1,20}$/.test(value)) throw new HTTPError(`${name} must be an id`, 400);

    const query = AdminAuditLog.createQueryBuilder("log")
        .orderBy("log.id", "DESC")
        .take(limit + 1);
    if (before) query.andWhere("log.id < :before", { before });
    if (actor) query.andWhere("log.actor_id = :actor", { actor });
    if (target) query.andWhere("log.target_id = :target", { target });
    if (area) query.andWhere("log.area = :area", { area });
    const rows = await query.getMany();
    const entries = rows.slice(0, limit);

    const ids = [...new Set(entries.flatMap((e) => [e.actor_id, e.target_id].filter((id): id is string => !!id)))];
    const users = ids.length ? await User.find({ where: { id: In(ids) }, select: { id: true, username: true, global_name: true } }) : [];
    res.json({
        entries,
        users: Object.fromEntries(users.map((u) => [u.id, u.global_name || u.username])),
        next: rows.length > limit ? entries[entries.length - 1].id : null,
    });
});

export default router;
