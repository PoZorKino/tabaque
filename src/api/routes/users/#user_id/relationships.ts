import { route } from "@spacebar/api/middlewares";
import { User } from "@spacebar/database";
import { Request, Response, Router } from "express";
import { UserMutualRelationsResponse } from "@spacebar/schemas";

const router: Router = Router({ mergeParams: true });

router.get(
    "/",
    route({
        description: "Get mutual relationships",
        responses: {
            200: { body: "UserRelationsResponse" },
            404: {
                body: "APIErrorResponse",
            },
        },
    }),
    async (req: Request, res: Response) => {
        const mutual_relations: UserMutualRelationsResponse = [];

        const requested_relations = await User.findOneOrFail({
            where: { id: req.params.user_id as string },
            relations: { relationships: true },
        });
        const self_relations = await User.findOneOrFail({
            where: { id: req.user_id },
            relations: { relationships: true },
        });

        for (const rmem of requested_relations.relationships) {
            for (const smem of self_relations.relationships)
                if (rmem.to_id === smem.to_id && rmem.type === 1 && rmem.to_id !== req.user_id) {
                    const relation_user = await User.getPublicUser(rmem.to_id);

                    mutual_relations.push({
                        id: relation_user.id,
                        username: relation_user.username,
                        avatar: relation_user.avatar,
                        discriminator: relation_user.discriminator,
                        public_flags: relation_user.public_flags,
                    });
                }
        }

        res.json(mutual_relations);
    },
);

export default router;
