import { Request, Response, Router } from "express";
import { HTTPError } from "lambert-server/HTTPError";
import { route } from "@spacebar/api/middlewares";
import { toOwnedApplication } from "@spacebar/api/util/handlers/Application";
import { Application, Guild } from "@spacebar/database";
import { handleFile } from "@spacebar/util";
import { ApplicationModifySchema } from "@spacebar/schemas";

const router: Router = Router({ mergeParams: true });

// TODO: actually make this be correct - this is just a copy paste of /applications/:id/index.ts minus delete
router.get(
    "/",
    route({
        responses: {
            200: {
                body: "Application",
            },
            400: {
                body: "APIErrorResponse",
            },
        },
    }),
    async (req: Request, res: Response) => {
        const app = await Application.findOneOrFail({
            where: { id: req.user_id },
            relations: { owner: true, bot: true },
        });

        return res.json(toOwnedApplication(app));
    },
);

router.patch(
    "/",
    route({
        requestBody: "ApplicationModifySchema",
        responses: {
            200: {
                body: "Application",
            },
            400: {
                body: "APIErrorResponse",
            },
        },
    }),
    async (req: Request, res: Response) => {
        const body = req.body as ApplicationModifySchema;

        const app = await Application.findOneOrFail({
            where: { id: req.user_id },
            relations: { owner: true, bot: true },
        });

        if (body.icon) {
            body.icon = await handleFile(`/app-icons/${app.id}`, body.icon as string);
        }
        if (body.cover_image) {
            body.cover_image = await handleFile(`/app-icons/${app.id}`, body.cover_image as string);
        }

        if (body.guild_id) {
            const guild = await Guild.findOneOrFail({
                where: { id: body.guild_id },
                select: { owner_id: true },
            });
            if (guild.owner_id != req.user_id) throw new HTTPError("You must be the owner of the guild to link it to an application", 400);
        }

        if (app.bot) {
            app.bot.assign({ bio: body.description });
            await app.bot.save();
        }

        app.assign(body);

        await app.save();

        return res.json(toOwnedApplication(app));
    },
);

export default router;
