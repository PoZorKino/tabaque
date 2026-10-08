import { Request, Response, Router } from "express";
import { route } from "@spacebar/api/middlewares";
import { User } from "@spacebar/database";

const router = Router({ mergeParams: true });

router.post("/", route({}), async (req: Request, res: Response) => {
    const username = String(req.body?.username ?? "");
    User.assertUsernameAllowed(username);
    res.json({
        taken: !User.isValidPomeloUsername(username) || (await User.isUsernameTaken(username, req.user_id)),
    });
});

export default router;
