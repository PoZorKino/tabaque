import { Request, Response, Router } from "express";
import { route } from "@spacebar/api/middlewares";
import { Member } from "@spacebar/database";
import { getPermission, PermissionResolvable } from "@spacebar/util";

const router = Router({ mergeParams: true });

router.patch(
    "/",
    route({
        requestBody: "MemberNickChangeSchema",
        responses: {
            200: {
                body: "PublicMember",
            },
            400: {
                body: "APIErrorResponse",
            },
            403: {
                body: "APIErrorResponse",
            },
        },
    }),
    async (req: Request, res: Response) => {
        const { guild_id } = req.params as { [key: string]: string };
        let permissionString: PermissionResolvable = "MANAGE_NICKNAMES";
        const member_id = req.params.member_id === "@me" ? ((permissionString = "CHANGE_NICKNAME"), req.user_id) : (req.params.member_id as string);

        const perms = await getPermission(req.user_id, guild_id);
        perms.hasThrow(permissionString);

        await Member.changeNickname(member_id, guild_id, req.body.nick);

        const member = await Member.findOne({
            where: { id: member_id, guild_id },
            relations: { roles: true },
        });

        res.send(member?.toPublicMember());
    },
);

export default router;
