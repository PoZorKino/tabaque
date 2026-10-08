import { Request, Response, Router } from "express";
import { route } from "@spacebar/api/middlewares";
import { clearMentionRaid } from "@spacebar/api/util";

const router = Router({ mergeParams: true });

router.post(
    "/",
    route({
        permission: "MANAGE_GUILD",
        responses: {
            204: {},
            403: { body: "APIErrorResponse" },
        },
    }),
    async (req: Request, res: Response) => {
        clearMentionRaid(req.params.guild_id as string);
        return res.status(204).send();
    },
);

export default router;
