import { Request, Response, Router } from "express";
import { HTTPError } from "lambert-server/HTTPError";
import { route } from "@spacebar/api/middlewares";
import { HelpArticle } from "@spacebar/database";
import { Snowflake } from "@spacebar/util";

const router = Router({ mergeParams: true });

router.get("/", route({ right: "OPERATOR", spacebarOnly: true, description: "Help center articles" }), async (req: Request, res: Response) => {
    res.json(await HelpArticle.find({ order: { position: "ASC", title: "ASC" } }));
});

router.post("/", route({ right: "OPERATOR", spacebarOnly: true, description: "Write a help center article" }), async (req: Request, res: Response) => {
    const { title, body, position } = req.body as { title?: string; body?: string; position?: number };
    if (typeof title !== "string" || !title.trim()) throw new HTTPError("title is required", 400);
    const article = await HelpArticle.save(
        HelpArticle.create({
            id: Snowflake.generate(),
            title: title.trim(),
            body: typeof body === "string" ? body : "",
            source: "custom",
            position: Number(position) || 0,
            updated_at: new Date(),
        }),
    );
    res.status(201).json(article);
});

router.patch("/:article_id", route({ right: "OPERATOR", spacebarOnly: true, description: "Edit a help center article" }), async (req: Request, res: Response) => {
    const article = await HelpArticle.findOne({ where: { id: req.params.article_id as string } });
    if (!article) throw new HTTPError("Article not found", 404);
    const { title, body, position } = req.body as { title?: string; body?: string; position?: number };
    if (title !== undefined) {
        if (typeof title !== "string" || !title.trim()) throw new HTTPError("title can't be empty", 400);
        article.title = title.trim();
    }
    if (body !== undefined) article.body = String(body);
    if (position !== undefined) article.position = Number(position) || 0;
    article.updated_at = new Date();
    res.json(await article.save());
});

router.delete(
    "/:article_id",
    route({ right: "OPERATOR", spacebarOnly: true, responses: { 204: {} }, description: "Delete a help center article" }),
    async (req: Request, res: Response) => {
        const result = await HelpArticle.delete({ id: req.params.article_id as string });
        if (!result.affected) throw new HTTPError("Article not found", 404);
        res.sendStatus(204);
    },
);

export default router;
