import { route } from "@spacebar/api/middlewares";
import { ensureStandardStickerPacks } from "@spacebar/api/util";
import { StickerPack } from "@spacebar/database";
import { Request, Response, Router } from "express";

const router: Router = Router({ mergeParams: true });

router.get(
    "/",
    route({
        responses: {
            200: {
                body: "StickersResponse",
            },
        },
    }),
    async (req: Request, res: Response) => {
        await ensureStandardStickerPacks();
        const sticker_packs = await StickerPack.find({
            relations: { stickers: true },
            order: { id: "ASC", stickers: { sort_value: "ASC" } },
        });

        res.json({ sticker_packs });
    },
);

export default router;
