import { Request, Response, Router } from "express";
import { route } from "@spacebar/api/middlewares";
import { limitedSince } from "@spacebar/api/util/utility/accountStanding";

const router = Router({ mergeParams: true });

// the client shows its limited access banner from this
router.get("/", route({ description: "Whether this account has limited access" }), async (req: Request, res: Response) => {
    const since = await limitedSince(req.user_id);
    res.set("Cache-Control", "no-store");
    res.json({ limited: !!since, since: since?.toISOString() ?? null });
});

export default router;
