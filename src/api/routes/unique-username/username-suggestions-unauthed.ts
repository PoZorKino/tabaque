import { Request, Response, Router } from "express";
import { route } from "@spacebar/api/middlewares";
import { User } from "@spacebar/database";

const router = Router({ mergeParams: true });

router.get("/", route({ authentication: "never" }), async (req: Request, res: Response) => {
    res.json({ username: await User.suggestUsername(String(req.query.global_name ?? "")) });
});

export default router;
