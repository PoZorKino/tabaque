import { Request, Response, Router } from "express";
import { Changelog } from "@spacebar/database";

const router = Router({ mergeParams: true });

// how many entries the client is told about
const MAX_ENTRIES = 20;

// The client opens the entry with the highest min_version it can use, so newer entries get higher numbers.
router.get("/config_:platform.json", async (req: Request, res: Response) => {
    const newest = await Changelog.find({ where: { published: true }, order: { id: "DESC" }, take: MAX_ENTRIES });
    const oldestFirst = [...newest].reverse();
    res.set("Cache-Control", "public, max-age=60").json(
        Object.fromEntries(oldestFirst.map((entry, i) => [entry.id, { min_version: i + 1, show_on_startup: entry.show_on_startup }])),
    );
});

router.get("/:platform/:id/:locale.json", async (req: Request, res: Response) => {
    const entry = await Changelog.findOne({ where: { id: String(req.params.id), published: true } });
    if (!entry) return res.sendStatus(404);
    res.set("Cache-Control", "public, max-age=60").json({
        date: entry.date,
        locale: String(req.params.locale),
        content: entry.content,
        ...(entry.asset ? { asset_type: entry.asset_type ?? 1, asset: entry.asset } : {}),
    });
});

export default router;
