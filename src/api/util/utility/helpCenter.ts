import fs from "node:fs/promises";
import path from "node:path";
import { HelpArticle } from "@spacebar/database";
import { ASSETS_FOLDER, instanceName } from "@spacebar/util";

// Discord's help center is Zendesk; its article API is public, the article pages themselves block bots
const ZENDESK = "https://support.discord.com/api/v2/help_center/en-us/articles";
const ARTICLE_LINK = /support\.discord\.com\/hc\/(?:[a-z-]+\/)?articles\/(\d+)/g;

// every article the cached web client links to; the cache only changes with a client rebuild
export async function clientArticleIds() {
    const dir = path.join(ASSETS_FOLDER, "cache");
    const ids = new Set<string>();
    for (const file of await fs.readdir(dir).catch(() => [] as string[])) {
        if (!file.endsWith(".js")) continue;
        for (const match of (await fs.readFile(path.join(dir, file), "utf8")).matchAll(ARTICLE_LINK)) ids.add(match[1]);
    }
    return [...ids];
}

// the instance replaces Discord's name and points links at its own help center; everything else is kept as fetched
export function rewriteArticle(html: string) {
    return (
        html
            .replace(/\bDiscord\b/g, instanceName())
            .replace(/https:\/\/support\.discord\.com\/hc\/(?:[a-z-]+\/)?articles\/(\d+)[^"'\s<)]*/g, "/hc/articles/$1")
            .replace(/https:\/\/support\.discord\.com\/hc/g, "/hc")
            // article images live on Discord's help center and are referenced relatively
            .replace(/(src|href)="\/hc\//g, '$1="https://support.discord.com/hc/')
    );
}

// refreshes a mirrored article; custom articles are never overwritten
export async function importArticle(id: string) {
    const existing = await HelpArticle.findOne({ where: { id } });
    if (existing && existing.source !== "discord") return "skipped";
    const res = await fetch(`${ZENDESK}/${id}.json`, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`Help article ${id} returned ${res.status}`);
    const { article } = (await res.json()) as { article: { title: string; body?: string | null } };
    await HelpArticle.save(
        HelpArticle.create({
            id,
            title: rewriteArticle(article.title),
            body: rewriteArticle(article.body ?? ""),
            source: "discord",
            position: existing?.position ?? 0,
            updated_at: new Date(),
        }),
    );
    return "imported";
}

export async function importAllArticles() {
    const ids = await clientArticleIds();
    const result = { imported: 0, skipped: 0, failed: [] as string[] };
    for (let i = 0; i < ids.length; i += 8) {
        await Promise.all(
            ids.slice(i, i + 8).map(async (id) => {
                try {
                    if ((await importArticle(id)) === "imported") result.imported++;
                    else result.skipped++;
                } catch (e) {
                    console.error(`[HelpCenter] couldn't import ${id}`, e);
                    result.failed.push(id);
                }
            }),
        );
    }
    return result;
}
