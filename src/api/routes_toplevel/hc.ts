import { Request, Response, Router } from "express";
import { route } from "@spacebar/api/middlewares";
import { HelpArticle } from "@spacebar/database";
import { instanceName } from "@spacebar/util";

// the help center the client sends its support links to; articles come from the admin panel
const router = Router({ mergeParams: true });

const escapeHtml = (text: string) => text.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);

const shell = (title: string, content: string) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} · ${escapeHtml(instanceName())} Help</title>
<style>
:root { --bg: #e0e3ff; --ink: #2e3338; --muted: #4e5058; --blurple: #5865f2; --callout: #c9cde6; --line: #c4c8e0; --link: #3a4ccf; --font: "gg sans", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 15px/1.5 var(--font); }
header { display: flex; align-items: center; gap: 24px; height: 64px; padding: 0 46px; }
header .brand { display: flex; align-items: center; gap: 8px; color: var(--ink); text-decoration: none; font-weight: 700; font-size: 22px; }
header .logo { width: 30px; height: 30px; border-radius: 8px; background: var(--blurple); }
header nav { display: flex; gap: 22px; margin-left: auto; }
header nav a { color: var(--ink); text-decoration: none; font-weight: 600; font-size: 15px; }
header .signin { background: #000; color: #fff; border-radius: 4px; padding: 10px 26px; font-weight: 600; text-decoration: none; font-size: 15px; }
main { max-width: 871px; margin: 0 auto; padding: 0 24px 72px; text-align: center; }
.crumbs { font-size: 15px; font-weight: 600; margin: 18px 0 22px; }
.crumbs a { color: var(--ink); text-decoration: none; }
.crumbs span { margin: 0 8px; }
.search { display: flex; align-items: center; gap: 10px; background: #fff; border: 1px solid #8f93a8; border-radius: 10px; height: 52px; padding: 0 18px; text-align: left; color: var(--muted); }
.hero-title { font-size: 84px; font-weight: 800; letter-spacing: -0.02em; color: var(--blurple); margin: 56px 0 8px; line-height: 0.95; text-transform: uppercase; }
.hero-sub { font-size: 20px; color: var(--ink); margin: 24px 0 0; }
main > h1 { font-size: 72px; line-height: 72px; font-weight: 500; margin: 56px 0 44px; color: #2e3338; letter-spacing: -0.01em; }
.article { text-align: left; font-size: 20px; line-height: 32px; color: #000; max-width: 702px; margin: 0 auto; }
.article h1 { font-size: 36px; line-height: 1.25; font-weight: 500; margin: 36px 0 14px; color: #000; }
.article h2 { font-size: 28px; line-height: 44.8px; margin: 32px 0 12px; font-weight: 500; color: #000; }
.article h3 { font-size: 22px; line-height: 1.4; margin: 24px 0 10px; font-weight: 500; color: #000; }
.article a { color: var(--link); }
.article img { max-width: 100%; height: auto; border-radius: 10px; }
.article ul, .article ol { padding-left: 24px; }
.article table { border-collapse: collapse; max-width: 100%; }
.article td, .article th { border: 1px solid var(--line); padding: 8px 12px; }
.article > div:first-child, .article > section:first-child, .article > table:first-child { background: var(--callout); border-radius: 16px; padding: 24px 28px; }
.card { display: block; background: #fff; border-radius: 14px; padding: 18px 22px; margin: 12px 0; color: var(--ink); text-decoration: none; font-weight: 600; text-align: left; }
.card:hover { box-shadow: 0 2px 10px rgba(0,0,0,.12); }
.card small { display: block; color: var(--muted); font-weight: 400; margin-top: 2px; }
.muted { color: var(--muted); }
.feedback { margin-top: 56px; padding-top: 26px; border-top: 1px solid var(--line); font-weight: 600; text-align: left; }
</style>
</head>
<body>
<header>
    <a class="brand" href="/hc"><span class="logo" aria-hidden="true"></span>${escapeHtml(instanceName())}</a>
    <nav><a href="/hc">Feedback</a><a href="/hc">Submit a request</a></nav>
    <a class="signin" href="/">Sign in</a>
    </header>
<main>${content}</main>
</body>
</html>`;

router.get("/", route({ spacebarOnly: true, authentication: "never" }), async (req: Request, res: Response) => {
    const articles = await HelpArticle.find({ order: { position: "ASC", title: "ASC" } });
    res.set("Cache-Control", "no-cache");
    const list = articles.map((a) => `<a class="card" href="/hc/articles/${escapeHtml(a.id)}">${escapeHtml(a.title)}</a>`).join("");
    res.type("html").send(
        shell(
            "Help Center",
            `<div class="hero-title">Help Center</div><p class="hero-sub">Find help for everything ${escapeHtml(instanceName())}.</p><div class="search" style="margin-top:36px">Search</div><div style="margin-top:40px">${list || '<p class="muted">No articles yet.</p>'}</div>`,
        ),
    );
});

router.get("/articles/:id", route({ spacebarOnly: true, authentication: "never" }), async (req: Request, res: Response) => {
    const article = await HelpArticle.findOne({ where: { id: req.params.id as string } });
    res.set("Cache-Control", "no-cache");
    if (!article) return res.status(404).type("html").send(shell("Not found", '<h1>Article not found</h1><p><a href="/hc">Back to the help center</a></p>'));
    // article bodies are HTML written by staff or mirrored from Discord's help center
    res.type("html").send(
        shell(
            article.title,
            `<div class="crumbs"><a href="/hc">Help Center</a><span>&gt;</span>${escapeHtml(article.title)}</div><div class="search">Search</div><h1>${escapeHtml(article.title)}</h1><div class="article">${article.body}</div><div class="feedback">Was this article helpful?</div>`,
        ),
    );
});

export default router;
