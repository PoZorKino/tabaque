import crypto from "node:crypto";
import { Config } from "./Config";
import { BaseMessageComponents, Embed, MessageComponentType, UnfurledMediaItem } from "@spacebar/schemas";

const signExternalPath = (path: string) => crypto.createHmac("sha1", Config.get().security.requestSignature).update(path).digest("base64url");

export const verifyExternalPath = (hash: string, path: string) => {
    const expected = signExternalPath(path);
    return hash.length === expected.length && crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expected));
};

export const externalProxyPath = (url: URL) => {
    const path = `${url.search ? `${encodeURIComponent(url.search)}/` : ""}${url.protocol.replace(":", "")}/${url.host}${url.pathname}`;
    return `/external/${signExternalPath(path)}/${path}`;
};

const cdnBase = () => (Config.get().cdn.endpointPublic || "").replace(/\/+$/, "");

export const externalProxyUrl = (url: URL) => `${cdnBase()}${externalProxyPath(url)}`;

export const corsProxyUrl = (url: URL) => {
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Unsupported media protocol");
    if (url.username || url.password) throw new Error("Media URL credentials are not allowed");
    if (url.origin === "https://cors.estrogen.delivery") return url.href;
    const target = new URL(url);
    target.hash = "";
    return `https://cors.estrogen.delivery/?url=${encodeURIComponent(target.href)}`;
};

export const isLocalMediaUrl = (url: string) => {
    if (url.startsWith("/") && !url.startsWith("//")) return true;
    const base = cdnBase();
    if (!base || !URL.canParse(base) || !URL.canParse(url)) return false;
    return new URL(url).origin === new URL(base).origin;
};

const proxied = (url?: string, current?: string) => {
    if (current && isLocalMediaUrl(current) && (!url || isLocalMediaUrl(url))) return current;
    if (!url || isLocalMediaUrl(url)) return url ?? current;
    if (!URL.canParse(url)) return undefined;
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return undefined;
    if (parsed.username || parsed.password) return undefined;
    return corsProxyUrl(parsed);
};

export function proxyComponentsMedia(components: BaseMessageComponents[]): BaseMessageComponents[] {
    const normalize = (media: UnfurledMediaItem) => {
        const url = proxied(media.url, media.proxy_url);
        return { ...media, url: url ?? "", proxy_url: url };
    };
    return components.map((component) => {
        if (component.type === MessageComponentType.Container)
            return {
                ...component,
                components: proxyComponentsMedia(component.components) as typeof component.components,
            };
        if (component.type === MessageComponentType.Section && component.accessory.type === MessageComponentType.Thumbnail)
            return {
                ...component,
                accessory: { ...component.accessory, media: normalize(component.accessory.media) },
            };
        if (component.type === MessageComponentType.MediaGallery)
            return {
                ...component,
                items: component.items.map((item) => ({ ...item, media: normalize(item.media) })),
            };
        if (component.type === MessageComponentType.File) return { ...component, file: normalize(component.file) };
        return component;
    });
}

export function proxyEmbedMedia(embed: Embed): Embed {
    const out: Embed = { ...embed };
    for (const key of ["image", "thumbnail", "video"] as const) {
        const media = embed[key];
        if (media?.url)
            out[key] = {
                ...media,
                url: proxied(media.url, media.proxy_url),
                proxy_url: proxied(media.url, media.proxy_url),
            };
    }
    if (embed.author?.icon_url)
        out.author = {
            ...embed.author,
            icon_url: proxied(embed.author.icon_url, embed.author.proxy_icon_url),
            proxy_icon_url: proxied(embed.author.icon_url, embed.author.proxy_icon_url),
        };
    if (embed.footer?.icon_url)
        out.footer = {
            ...embed.footer,
            icon_url: proxied(embed.footer.icon_url, embed.footer.proxy_icon_url),
            proxy_icon_url: proxied(embed.footer.icon_url, embed.footer.proxy_icon_url),
        };
    return out;
}
