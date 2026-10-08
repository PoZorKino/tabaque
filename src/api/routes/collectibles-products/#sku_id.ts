import { route } from "@spacebar/api/middlewares";
import { Collectibles, DiscordApiErrors } from "@spacebar/util";
import { Request, Response, Router } from "express";

const router = Router({ mergeParams: true });

router.get("/", route({}), async (req: Request, res: Response) => {
    const product = await Collectibles.product(req.params.sku_id as string);
    if (!product) throw DiscordApiErrors.UNKNOWN_SKU;
    res.json(product);
});

export default router;
