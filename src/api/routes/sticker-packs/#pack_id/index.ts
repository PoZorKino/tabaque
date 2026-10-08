import { route } from "@spacebar/api/middlewares";
import { ensureStandardStickerPacks } from "@spacebar/api/util";
import { StickerPack } from "@spacebar/database";
import { HTTPError } from "lambert-server/HTTPError";
import { Request, Response, Router } from "express";

const router: Router = Router({ mergeParams: true });

router.get(
    "/",
    route({
        responses: {
            200: {},
            404: {
                body: "APIErrorResponse",
            },
        },
    }),
    async (req: Request, res: Response) => {
        await ensureStandardStickerPacks();
        const pack = await StickerPack.findOne({
            where: { id: req.params.pack_id as string },
            relations: { stickers: true },
            order: { stickers: { sort_value: "ASC" } },
        });
        if (!pack) throw new HTTPError("Unknown sticker pack", 404);
        res.json(pack);
    },
);

export default router;
