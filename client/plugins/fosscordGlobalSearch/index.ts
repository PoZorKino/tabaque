import definePlugin from "@utils/types";
import { ChannelStore, GuildStore, NavigationRouter, RestAPI, UserStore } from "@webpack/common";

import { FosscordAuthor } from "../fosscordCore/shared";
import managedStyle from "./style.css?managed";

interface Row {
    title: string;
    subtitle?: string;
    terms?: string[];
    // rows that load more results rather than going somewhere
    keepOpen?: boolean;
    go: () => void;
}
interface Section {
    name: string;
    rows: Row[];
}
interface Filter {
    label: string;
    param: string;
    value: string;
}

const PAGE = 10;
const DISCORD_EPOCH = 1420070400000;

// ids are time-ordered, so a date becomes the smallest id a message sent then could have
const toSnowflake = (date: Date) => ((BigInt(date.getTime()) - BigInt(DISCORD_EPOCH)) << BigInt(22)).toString();

let overlay: HTMLDivElement | null = null;
let dialog: HTMLDivElement | null = null;
let results: HTMLDivElement | null = null;
let chips: HTMLDivElement | null = null;
let input: HTMLInputElement | null = null;
let filterButton: HTMLButtonElement | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let selected = 0;
let latest = 0;
let visibleRows: Row[] = [];

// what the last search found, kept so "show more" can add to it
let localSections: Section[] = [];
let discoverRows: Row[] = [];
let messageRows: Row[] = [];
let messageTotal = 0;
let lastText = "";

// message filters from the Filters dialog, by key (from, in, has, mentions, after, before, author)
let filters: Record<string, Filter> = {};

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

const lower = (value: string | undefined | null) => (value ?? "").toLowerCase();

// 3 starts with, 2 a word starts with, 1 contains, 0 no match
function score(value: string | undefined | null, text: string) {
    if (!text) return 1;
    const v = lower(value);
    if (v.startsWith(text)) return 3;
    if (v.includes(` ${text}`)) return 2;
    return v.includes(text) ? 1 : 0;
}

// "@dm hello" searches one place. Several can be combined, and with none every place is searched.
const AT_FILTERS: Record<string, string> = {
    dm: "dm",
    dms: "dm",
    group: "group",
    groups: "group",
    server: "server",
    servers: "server",
    discover: "discover",
    discoverable: "discover",
    msg: "msg",
    message: "msg",
    messages: "msg",
};

function parseQuery(raw: string) {
    const tokens = raw.trim().split(/\s+/).filter(Boolean);
    const places = new Set<string>();
    while (tokens.length && tokens[0].startsWith("@") && AT_FILTERS[tokens[0].slice(1).toLowerCase()]) places.add(AT_FILTERS[tokens.shift()!.slice(1).toLowerCase()]);
    return { places, text: tokens.join(" ").trim().toLowerCase() };
}

const wants = (places: Set<string>, ...names: string[]) => places.size === 0 || names.some((name) => places.has(name));
const messageFiltersActive = () => Object.keys(filters).length > 0;

function allUsers(): any[] {
    try {
        return Object.values(UserStore.getUsers());
    } catch {
        return [];
    }
}

function guildChannels(): { id: string; name: string; guild: string }[] {
    const found: { id: string; name: string; guild: string }[] = [];
    for (const guild of Object.values(GuildStore.getGuilds()) as any[]) {
        try {
            for (const channel of Object.values((ChannelStore as any).getMutableGuildChannelsForGuild(guild.id) ?? {}) as any[])
                if (channel.name) found.push({ id: channel.id, name: channel.name, guild: guild.name });
        } catch {
            // a server whose channels are not loaded yet is simply not offered
        }
    }
    return found;
}

function dmTitle(channel: any) {
    const names = (channel.recipients ?? []).map((id: string) => UserStore.getUser(id)).filter(Boolean);
    return {
        title: channel.name || names.map((user: any) => user.globalName || user.username).join(", "),
        handles: names.map((user: any) => user.username).join(" "),
        group: names.length > 1 || !!channel.name,
    };
}

function resolveUser(text: string): { id: string; label: string } | undefined {
    const t = text.trim();
    if (/^\d{15,}$/.test(t)) return { id: t, label: UserStore.getUser(t)?.username ?? t };
    const user = allUsers().find((u) => lower(u.username) === lower(t) || lower(u.globalName) === lower(t));
    return user ? { id: user.id, label: user.globalName || user.username } : undefined;
}

function resolveChannel(text: string): { id: string; label: string } | undefined {
    const t = text.trim();
    if (/^\d{15,}$/.test(t)) return { id: t, label: ChannelStore.getChannel(t)?.name ?? t };
    const dm = ChannelStore.getSortedPrivateChannels().find((channel: any) => lower(dmTitle(channel).title) === lower(t));
    if (dm) return { id: dm.id, label: dmTitle(dm).title };
    const channel = guildChannels().find((c) => lower(c.name) === lower(t.replace(/^#/, "")));
    return channel ? { id: channel.id, label: `#${channel.name}` } : undefined;
}

// everything the client already has loaded: joined servers, DMs and group DMs, best matches first
function findLocal(text: string, places: Set<string>): Section[] {
    const servers = wants(places, "server")
        ? (Object.values(GuildStore.getGuilds()) as any[])
              .map((guild) => ({ guild, s: score(guild.name, text) }))
              .filter((entry) => entry.s > 0)
              .sort((a, b) => b.s - a.s)
              .slice(0, 8)
              .map(({ guild }) => ({ title: guild.name, subtitle: "Server", terms: [text], go: () => NavigationRouter.transitionTo(`/channels/${guild.id}`) }) as Row)
        : [];

    const chats = ChannelStore.getSortedPrivateChannels()
        .map((channel: any) => ({ channel, ...dmTitle(channel) }))
        .filter((entry: any) => (entry.group ? wants(places, "group", "dm") : wants(places, "dm")))
        .map((entry: any) => ({ ...entry, s: Math.max(score(entry.title, text), score(entry.handles, text)) }))
        .filter((entry: any) => entry.s > 0)
        .sort((a: any, b: any) => b.s - a.s)
        .slice(0, 8)
        .map(
            (entry: any) =>
                ({
                    title: entry.title,
                    subtitle: entry.group ? "Group DM" : "Direct message",
                    terms: [text],
                    go: () => NavigationRouter.transitionTo(`/channels/@me/${entry.channel.id}`),
                }) as Row,
        );

    return [
        { name: "Direct messages", rows: chats },
        { name: "Your servers", rows: servers },
    ];
}

async function findDiscoverable(text: string): Promise<Row[]> {
    const response = await RestAPI.get({ url: "/discoverable-guilds/search", query: { query: text, limit: 8 } }).catch(() => null);
    const joined = new Set(Object.keys(GuildStore.getGuilds()));
    return ((response?.body?.guilds as any[]) ?? [])
        .filter((guild) => !joined.has(guild.id))
        .map((guild) => ({ title: guild.name, subtitle: "Discoverable server", terms: [text], go: () => NavigationRouter.transitionTo(`/channels/${guild.id}`) }));
}

async function findMessages(text: string, offset: number): Promise<{ rows: Row[]; total: number }> {
    const query: Record<string, string | number> = { content: text, limit: PAGE, offset };
    for (const filter of Object.values(filters)) query[filter.param] = filter.value;
    const response = await RestAPI.get({ url: "/users/@me/messages/search", query }).catch(() => null);
    const terms = text.split(/\s+/).filter(Boolean);
    const rows = ((response?.body?.messages as any[][]) ?? [])
        .map((group) => group.find((message) => message.hit) ?? group[0])
        .filter(Boolean)
        .map((message): Row => {
            const card = message.embeds?.[0]?.fields?.find((field: any) => field.name === "header")?.value;
            const channel = ChannelStore.getChannel(message.channel_id);
            const where = channel?.name ? `#${channel.name}` : "Direct message";
            const when = message.timestamp ? new Date(message.timestamp).toLocaleDateString() : "";
            return {
                title: String(message.content ?? "").slice(0, 160) || card || "(attachment)",
                subtitle: [message.author?.global_name || message.author?.username || "Someone", where, when].filter(Boolean).join(" · "),
                terms,
                go: () => NavigationRouter.transitionTo(`/channels/${message.guild_id ?? "@me"}/${message.channel_id}/${message.id}`),
            };
        });
    return { rows, total: Number(response?.body?.total_results ?? rows.length) };
}

// writes text into a node with each searched word marked, without ever treating it as HTML
function fillMarked(node: HTMLElement, text: string, terms: string[] = []) {
    const words = terms.map((t) => t.trim()).filter(Boolean);
    if (!words.length) return void (node.textContent = text);
    const pattern = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "ig");
    for (const part of text.split(pattern)) {
        if (!part) continue;
        if (pattern.test(part)) node.appendChild(el("mark", "", part));
        else node.appendChild(document.createTextNode(part));
        pattern.lastIndex = 0;
    }
}

function highlightSelection() {
    if (!results) return;
    for (const node of Array.from(results.querySelectorAll<HTMLElement>(".fosscord-gs-row"))) node.classList.toggle("fosscord-gs-active", Number(node.dataset.index) === selected);
    results.querySelector(".fosscord-gs-active")?.scrollIntoView({ block: "nearest" });
}

function draw() {
    if (!results) return;
    const sections: Section[] = [...localSections, { name: "Discoverable servers", rows: discoverRows }];
    const more: Row[] =
        messageRows.length < messageTotal ? [{ title: `Show more messages (${messageTotal - messageRows.length} left)`, keepOpen: true, go: () => void loadMoreMessages() }] : [];
    sections.push({ name: messageTotal ? `Messages · ${messageTotal.toLocaleString()}` : "Messages", rows: [...messageRows, ...more] });

    results.replaceChildren();
    visibleRows = [];
    for (const section of sections) {
        if (!section.rows.length) continue;
        results.appendChild(el("div", "fosscord-gs-heading", section.name));
        for (const row of section.rows) {
            const index = visibleRows.push(row) - 1;
            const item = el("div", `fosscord-gs-row${row.keepOpen ? " fosscord-gs-more" : ""}`);
            item.dataset.index = String(index);
            const title = el("span", "fosscord-gs-title");
            fillMarked(title, row.title, row.terms);
            item.appendChild(title);
            if (row.subtitle) item.appendChild(el("span", "fosscord-gs-sub", row.subtitle));
            item.addEventListener("click", () => {
                if (!row.keepOpen) close();
                row.go();
            });
            results.appendChild(item);
        }
    }
    if (!visibleRows.length) {
        const typed = !!input?.value.trim() || messageFiltersActive();
        results.appendChild(
            el(
                "div",
                "fosscord-gs-empty",
                typed
                    ? "Nothing found. Try fewer words, or clear a filter."
                    : "Search messages, people, servers and discoverable servers. Start with @dm, @group, @server, @discover or @msg to search one place.",
            ),
        );
    }
    highlightSelection();
}

async function loadMoreMessages() {
    const mine = latest;
    const next = await findMessages(lastText, messageRows.length);
    if (mine !== latest || !overlay) return;
    messageRows = [...messageRows, ...next.rows];
    messageTotal = next.total;
    draw();
}

function search() {
    const { places, text } = parseQuery(input?.value ?? "");
    const mine = ++latest;
    selected = 0;
    lastText = text;
    clearTimeout(timer);
    localSections = [];
    discoverRows = [];
    messageRows = [];
    messageTotal = 0;

    const messageOnly = messageFiltersActive();
    // a place filter on its own lists that place; otherwise there has to be something to look for
    if (!text && !messageOnly && places.size === 0) return draw();
    if (!messageOnly) localSections = findLocal(text, places);
    draw();

    const wantDiscover = !messageOnly && wants(places, "discover");
    const wantMessages = wants(places, "msg") && (!!text || messageOnly);
    if (!wantDiscover && !wantMessages) return;
    timer = setTimeout(async () => {
        const [found, messages] = await Promise.all([wantDiscover ? findDiscoverable(text) : [], wantMessages ? findMessages(text, 0) : { rows: [], total: 0 }]);
        if (mine !== latest || !overlay) return;
        discoverRows = found;
        messageRows = messages.rows;
        messageTotal = messages.total;
        draw();
    }, 250);
}

function drawChips() {
    if (!chips || !filterButton) return;
    chips.replaceChildren();
    const count = Object.keys(filters).length;
    filterButton.textContent = count ? `Filters · ${count}` : "Filters";
    filterButton.classList.toggle("fosscord-gs-on", count > 0);
    for (const [key, filter] of Object.entries(filters)) {
        const chip = el("button", "fosscord-gs-chip", `${filter.label} ×`);
        chip.type = "button";
        chip.title = "Remove this filter";
        chip.addEventListener("click", () => {
            delete filters[key];
            drawChips();
            search();
        });
        chips.appendChild(chip);
    }
}

function field(label: string, hint: string, control: HTMLElement) {
    const wrap = el("div", "fosscord-gs-field");
    wrap.append(el("div", "fosscord-gs-label", label), el("div", "fosscord-gs-hint", hint), control);
    return wrap;
}

function listInput(id: string, placeholder: string, options: string[], value: string) {
    const box = el("input");
    box.setAttribute("list", id);
    box.placeholder = placeholder;
    box.value = value;
    const datalist = el("datalist");
    datalist.id = id;
    for (const option of new Set(options)) datalist.appendChild(Object.assign(el("option"), { value: option }));
    const wrap = el("div", "fosscord-gs-control");
    wrap.append(box, datalist);
    return { box, wrap };
}

function selectInput(options: [string, string][], value: string) {
    const select = el("select");
    for (const [v, text] of options) select.appendChild(Object.assign(el("option", "", text), { value: v }));
    select.value = value;
    return select;
}

function closeDialog() {
    dialog?.remove();
    dialog = null;
    input?.focus();
}

function openDialog() {
    if (dialog) return;
    dialog = el("div", "fosscord-gs-overlay fosscord-gs-dialog-overlay");
    dialog.addEventListener("mousedown", (event) => event.target === dialog && closeDialog());
    const box = el("div", "fosscord-gs-dialog");

    const header = el("div", "fosscord-gs-dialog-header");
    const close = el("button", "fosscord-gs-x", "×");
    close.type = "button";
    close.setAttribute("aria-label", "Close");
    close.addEventListener("click", closeDialog);
    header.append(el("h2", "", "Filters"), close);

    const usernames = allUsers().map((u) => u.username);
    const channelNames = [...ChannelStore.getSortedPrivateChannels().map((c: any) => dmTitle(c).title), ...guildChannels().map((c) => `#${c.name}`)];
    const current = (key: string) => filters[key]?.label.replace(/^[^:]+: /, "") ?? "";

    const from = listInput("fosscord-gs-from", "ex. username", usernames, current("from"));
    const where = listInput("fosscord-gs-in", "ex. a DM or #channel", channelNames, current("in"));
    const mentions = listInput("fosscord-gs-mentions", "ex. username", usernames, current("mentions"));
    const has = selectInput(
        [
            ["", "Any content"],
            ["link", "Link"],
            ["embed", "Embed"],
            ["file", "File"],
            ["image", "Image"],
            ["video", "Video"],
            ["sound", "Sound"],
            ["sticker", "Sticker"],
            ["poll", "Poll"],
        ],
        filters.has?.value ?? "",
    );
    const after = Object.assign(el("input"), { type: "date", value: filters.after ? current("after") : "" });
    const before = Object.assign(el("input"), { type: "date", value: filters.before ? current("before") : "" });
    const dates = el("div", "fosscord-gs-dates");
    dates.append(el("label", "", "After"), after, el("label", "", "Before"), before);
    const author = selectInput(
        [
            ["", "Anyone"],
            ["user", "Users"],
            ["bot", "Bots"],
            ["webhook", "Webhooks"],
        ],
        filters.author?.value ?? "",
    );

    const body = el("div", "fosscord-gs-dialog-body");
    const problem = el("div", "fosscord-gs-problem");
    body.append(
        field("From", "Sent by this user", from.wrap),
        field("In", "Sent in this DM or channel", where.wrap),
        field("Has", "Includes this type of content", has),
        field("Mentions", "Mentions this user", mentions.wrap),
        field("Date", "When the message was sent", dates),
        field("Author type", "Sent by this kind of author", author),
        problem,
    );

    const footer = el("div", "fosscord-gs-dialog-footer");
    const clear = el("button", "fosscord-gs-link", "Clear Filters");
    clear.type = "button";
    clear.addEventListener("click", () => {
        filters = {};
        drawChips();
        closeDialog();
        search();
    });
    const cancel = el("button", "fosscord-gs-secondary", "Cancel");
    cancel.type = "button";
    cancel.addEventListener("click", closeDialog);
    const apply = el("button", "fosscord-gs-primary", "Apply Filters");
    apply.type = "button";
    apply.addEventListener("click", () => {
        const next: Record<string, Filter> = {};
        const misses: string[] = [];
        const person = (key: string, text: string, param: string, label: string) => {
            if (!text.trim()) return;
            const found = resolveUser(text);
            if (found) next[key] = { label: `${label}: ${found.label}`, param, value: found.id };
            else misses.push(`${label}: no one called "${text.trim()}"`);
        };
        person("from", from.box.value, "author_id", "From");
        person("mentions", mentions.box.value, "mentions", "Mentions");
        if (where.box.value.trim()) {
            const found = resolveChannel(where.box.value);
            if (found) next.in = { label: `In: ${found.label}`, param: "channel_id", value: found.id };
            else misses.push(`In: nothing called "${where.box.value.trim()}"`);
        }
        if (has.value) next.has = { label: `Has: ${has.value}`, param: "has", value: has.value };
        if (author.value) next.author = { label: `Author: ${author.value}`, param: "author_type", value: author.value };
        if (after.value) next.after = { label: `After: ${after.value}`, param: "min_id", value: toSnowflake(new Date(`${after.value}T00:00:00`)) };
        if (before.value)
            next.before = { label: `Before: ${before.value}`, param: "max_id", value: toSnowflake(new Date(new Date(`${before.value}T00:00:00`).getTime() + 86_400_000)) };
        if (misses.length) return void (problem.textContent = misses.join(" · "));
        filters = next;
        drawChips();
        closeDialog();
        search();
    });
    footer.append(clear, el("span", "fosscord-gs-spacer"), cancel, apply);

    box.append(header, body, footer);
    dialog.appendChild(box);
    document.body.appendChild(dialog);
}

function close() {
    clearTimeout(timer);
    dialog?.remove();
    overlay?.remove();
    dialog = overlay = results = chips = input = filterButton = null;
    visibleRows = [];
}

function open() {
    if (overlay) return input?.focus();
    overlay = el("div", "fosscord-gs-overlay");
    overlay.addEventListener("mousedown", (event) => event.target === overlay && close());

    const panel = el("div", "fosscord-gs-panel");
    const bar = el("div", "fosscord-gs-bar");
    input = el("input");
    input.placeholder = "Search everything";
    input.setAttribute("aria-label", "Search everything");
    input.addEventListener("input", search);
    input.addEventListener("keydown", (event) => {
        if (event.key === "Escape") return dialog ? closeDialog() : close();
        if (event.key === "ArrowDown") {
            selected = Math.min(selected + 1, visibleRows.length - 1);
            highlightSelection();
            event.preventDefault();
        }
        if (event.key === "ArrowUp") {
            selected = Math.max(selected - 1, 0);
            highlightSelection();
            event.preventDefault();
        }
        if (event.key === "Enter" && visibleRows[selected]) {
            const row = visibleRows[selected];
            if (!row.keepOpen) close();
            row.go();
        }
    });
    filterButton = el("button", "fosscord-gs-filter", "Filters");
    filterButton.type = "button";
    filterButton.addEventListener("click", openDialog);
    bar.append(el("span", "fosscord-gs-glass", "⌕"), input, filterButton);

    chips = el("div", "fosscord-gs-chips");
    results = el("div", "fosscord-gs-results");
    panel.append(bar, chips, results);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    drawChips();
    localSections = [];
    discoverRows = [];
    messageRows = [];
    messageTotal = 0;
    draw();
    input.focus();
}

const onKey = (event: KeyboardEvent) => {
    if (event.key.toLowerCase() !== "f" || !(event.ctrlKey || event.metaKey) || event.shiftKey || event.altKey) return;
    event.preventDefault();
    event.stopPropagation();
    open();
};

export default definePlugin({
    name: "FosscordGlobalSearch",
    description: "Ctrl+F searches everything at once: messages in every channel, DMs and group DMs, your servers and discoverable servers, with filters.",
    authors: [FosscordAuthor],
    required: true,
    managedStyle,

    start() {
        window.addEventListener("keydown", onKey, true);
    },

    stop() {
        window.removeEventListener("keydown", onKey, true);
        close();
    },
});
