import { Request, Response, Router } from "express";
import { HTTPError } from "lambert-server/HTTPError";
import { route } from "@spacebar/api/middlewares";
import { Changelog } from "@spacebar/database";
import { Snowflake } from "@spacebar/util";

const router = Router({ mergeParams: true });

interface ChangelogBody {
    date?: string;
    content?: string;
    asset_type?: number | null;
    asset?: string | null;
    show_on_startup?: boolean;
    published?: boolean;
}

// checks the fields that were sent and returns them in the shape the table stores
function parse(body: ChangelogBody, partial: boolean) {
    const out: Partial<Changelog> = {};
    if (!partial || body.date !== undefined) {
        if (typeof body.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.date) || Number.isNaN(Date.parse(body.date)))
            throw new HTTPError("date must look like 2026-10-08", 400);
        out.date = body.date;
    }
    if (!partial || body.content !== undefined) {
        if (typeof body.content !== "string" || !body.content.trim() || body.content.length > 8000)
            throw new HTTPError("content is required and can be up to 8000 characters", 400);
        out.content = body.content;
    }
    if (body.asset !== undefined) {
        if (!body.asset) {
            out.asset = null;
            out.asset_type = null;
        } else {
            const type = Number(body.asset_type ?? 1);
            if (type !== 0 && type !== 1) throw new HTTPError("asset_type must be 0 (YouTube video id) or 1 (image)", 400);
            if (type === 0 && !/^[\w-]{6,20}$/.test(body.asset)) throw new HTTPError("that is not a YouTube video id", 400);
            if (type === 1 && !/^https:\/\/\S{1,480}$/.test(body.asset)) throw new HTTPError("images must be an https link", 400);
            out.asset = body.asset;
            out.asset_type = type;
        }
    }
    if (body.show_on_startup !== undefined) out.show_on_startup = !!body.show_on_startup;
    if (body.published !== undefined) out.published = !!body.published;
    return out;
}

router.get("/", route({ right: "OPERATOR", spacebarOnly: true, description: "What's new entries, newest first" }), async (req: Request, res: Response) => {
    res.json(await Changelog.find({ order: { id: "DESC" } }));
});

router.post("/", route({ right: "OPERATOR", spacebarOnly: true, description: "Write a What's new entry" }), async (req: Request, res: Response) => {
    const fields = parse(req.body as ChangelogBody, false);
    const entry = await Changelog.save(Changelog.create({ asset: null, asset_type: null, show_on_startup: true, published: true, ...fields, id: Snowflake.generate() }));
    res.status(201).json(entry);
});

router.patch("/:changelog_id", route({ right: "OPERATOR", spacebarOnly: true, description: "Edit a What's new entry" }), async (req: Request, res: Response) => {
    const entry = await Changelog.findOne({ where: { id: String(req.params.changelog_id) } });
    if (!entry) throw new HTTPError("Entry not found", 404);
    Object.assign(entry, parse(req.body as ChangelogBody, true));
    res.json(await entry.save());
});

router.delete(
    "/:changelog_id",
    route({ right: "OPERATOR", spacebarOnly: true, responses: { 204: {} }, description: "Delete a What's new entry" }),
    async (req: Request, res: Response) => {
        const result = await Changelog.delete({ id: String(req.params.changelog_id) });
        if (!result.affected) throw new HTTPError("Entry not found", 404);
        res.sendStatus(204);
    },
);

export default router;
