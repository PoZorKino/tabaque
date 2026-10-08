import { Request, Response, Router } from "express";
import { route } from "@spacebar/api/middlewares";
import { Collectibles } from "@spacebar/util";

const router = Router({ mergeParams: true });

router.get(
    "/",
    route({
        right: "OPERATOR",
        spacebarOnly: true,
        description: "Where the Shop catalogue comes from and when it was last refreshed",
    }),
    async (req: Request, res: Response) => {
        res.json(await Collectibles.status());
    },
);

router.post(
    "/refresh",
    route({
        right: "OPERATOR",
        spacebarOnly: true,
        description: "Download the collectibles catalogue and profile effects again and reload the Shop",
    }),
    async (req: Request, res: Response) => {
        await Collectibles.refresh();
        console.log(`[Admin] User ${req.user_id} refreshed the collectibles catalogue`);
        res.json(await Collectibles.status());
    },
);

export default router;
