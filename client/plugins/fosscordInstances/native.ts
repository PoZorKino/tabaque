/*
 * Fosscord instance switcher, main process.
 * Sends the desktop app's main window to a self-hosted instance instead of discord.com.
 * AGPL-3.0-or-later
 */

import { app, BrowserWindow, desktopCapturer, IpcMainInvokeEvent, net, session } from "electron";
import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import { dirname, extname, join, resolve, sep } from "path";

export interface Instance {
    name: string;
    url: string;
}
export interface InstanceConfig {
    current: number;
    instances: Instance[];
    // drop the Vencord bundle the instance injects into its own page, for when Equicord carries the Fosscord plugins itself
    blockServerMod: boolean;
}

const OFFICIAL = new Set(["discord.com", "ptb.discord.com", "canary.discord.com"]);

const DEFAULTS: InstanceConfig = {
    current: 0,
    blockServerMod: false,
    instances: [
        { name: "meow.dexx.moe", url: "https://meow.dexx.moe" },
        { name: "social.dexx.moe", url: "https://social.dexx.moe" },
        { name: "Local (WSL)", url: "http://fosscord.localhost:3001" },
        { name: "Discord", url: "https://ptb.discord.com" },
    ],
};

const file = () => join(app.getPath("userData"), "fosscord-instances.json");

function origin(raw: unknown) {
    try {
        const url = new URL(String(raw).trim());
        if (url.protocol !== "http:" && url.protocol !== "https:") return null;
        return url.origin;
    } catch {
        return null;
    }
}

function sanitize(input: Partial<InstanceConfig> | undefined): InstanceConfig {
    const instances: Instance[] = [];
    for (const item of input?.instances ?? []) {
        const url = origin(item?.url);
        const name = String(item?.name ?? "")
            .trim()
            .slice(0, 40);
        if (url && name && !instances.some((x) => x.url === url)) instances.push({ name, url });
    }
    if (!instances.length) return structuredClone(DEFAULTS);
    const current = Number.isInteger(input?.current) && input!.current! >= 0 && input!.current! < instances.length ? input!.current! : 0;
    return { current, instances, blockServerMod: !!input?.blockServerMod };
}

function load(): InstanceConfig {
    try {
        return sanitize(JSON.parse(readFileSync(file(), "utf8")));
    } catch {
        return structuredClone(DEFAULTS);
    }
}

let config: InstanceConfig | undefined;
const get = () => (config ??= load());

function save(next: InstanceConfig) {
    config = sanitize(next);
    mkdirSync(dirname(file()), { recursive: true });
    writeFileSync(file(), JSON.stringify(config, null, 4));
    return config;
}

const target = () => get().instances[get().current];
const isOfficial = (url: string) => OFFICIAL.has(new URL(url).hostname);

app.whenReady().then(() => {
    session.defaultSession.webRequest.onBeforeRequest({ urls: ["https://discord.com/*", "https://ptb.discord.com/*", "https://canary.discord.com/*"] }, (details, callback) => {
        const url = new URL(details.url);

        // the desktop shell opens https://<discord host>/app; open the chosen instance there instead
        if (OFFICIAL.has(url.hostname)) {
            const instance = target();
            if (details.resourceType !== "mainFrame" || !instance || isOfficial(instance.url)) return callback({});
            const path = url.pathname === "/" ? "/app" : url.pathname;
            return callback({ redirectURL: `${instance.url}${path}${url.search}` });
        }

        callback({});
    });
});

// Discord's own permission rules only trust its own pages, so the microphone is refused on an instance
const trusted = (url?: string) => {
    try {
        const { origin, hostname } = new URL(url ?? "");
        return OFFICIAL.has(hostname) || get().instances.some((x) => x.url === origin);
    } catch {
        return false;
    }
};

const esc = (text: string) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

// the browser engine shares the screen through getDisplayMedia, which in Electron needs the app to name the source
async function pickSource(parent: BrowserWindow | null) {
    const sources = await desktopCapturer.getSources({ types: ["screen", "window"], thumbnailSize: { width: 320, height: 180 }, fetchWindowIcons: false });
    if (!sources.length) return null;

    return new Promise<Electron.DesktopCapturerSource | null>((resolve) => {
        // no Node in the page: tiles are plain links, and the click arrives here as an in-page navigation
        const win = new BrowserWindow({
            width: 820,
            height: 600,
            parent: parent ?? undefined,
            title: "Share your screen",
            autoHideMenuBar: true,
            backgroundColor: "#1e1f22",
            webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true },
        });
        let done = false;
        const finish = (id: string | null) => {
            if (done) return;
            done = true;
            if (!win.isDestroyed()) win.close();
            resolve(sources.find((s) => s.id === id) ?? null);
        };
        win.webContents.on("did-navigate-in-page", (_, url) => {
            const m = /#pick=(.*)$/.exec(url);
            if (m) finish(decodeURIComponent(m[1]) || null);
        });
        win.on("closed", () => finish(null));

        const tile = (s: Electron.DesktopCapturerSource) =>
            `<a href="#pick=${encodeURIComponent(s.id)}"><img src="${s.thumbnail.toDataURL()}"><span>${esc(s.name.slice(0, 60))}</span></a>`;
        const group = (title: string, list: Electron.DesktopCapturerSource[]) => (list.length ? `<h3>${title}</h3><div class="grid">${list.map(tile).join("")}</div>` : "");
        const html = `<!doctype html><meta charset="utf-8"><style>
            body{margin:0;padding:16px;background:#1e1f22;color:#f2f3f5;font:14px sans-serif}h3{margin:14px 0 8px;font-size:13px;color:#b5bac1}
            .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px}
            a{display:block;background:#2b2d31;color:inherit;border:2px solid transparent;border-radius:8px;padding:8px;cursor:pointer;text-decoration:none}
            a:hover{border-color:#5865f2}img{width:100%;border-radius:4px;display:block;margin-bottom:6px}span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        </style>${group(
            "Screens",
            sources.filter((s) => s.id.startsWith("screen")),
        )}${group(
            "Windows",
            sources.filter((s) => !s.id.startsWith("screen")),
        )}
        <script>document.addEventListener("keydown",e=>{if(e.key==="Escape")location.hash="#pick="})</script>`;
        // a data: page can't navigate (not even to its own #fragment), so the picker lives in a temp file
        const file = join(app.getPath("temp"), `fosscord-picker-${Date.now()}.html`);
        writeFileSync(file, html);
        win.on("closed", () => {
            try {
                unlinkSync(file);
            } catch {
                /* already gone */
            }
        });
        void win.loadFile(file);
    });
}

function allowInstancePermissions(ses: Electron.Session) {
    ses.setPermissionRequestHandler((contents, _permission, callback, details) => callback(trusted(details.requestingUrl || contents.getURL())));
    ses.setPermissionCheckHandler((contents, _permission, origin) => trusted(origin || contents?.getURL()));
    ses.setDisplayMediaRequestHandler(async (request, callback) => {
        try {
            const source = trusted(request.frame?.url) ? await pickSource(BrowserWindow.getFocusedWindow()) : null;
            // lets the client title its stream panel after what is being shared
            if (source) void request.frame?.executeJavaScript(`window.__fosscordPicked=${JSON.stringify(source.name)}`).catch(() => {});
            if (!source) return callback({});
            callback({ video: source, ...(request.audioRequested ? { audio: "loopback" as const } : {}) });
        } catch {
            callback({});
        }
    });
}

// Discord installs its handlers while the window starts up, so ours has to go in after
// Only for a self-hosted instance: on discord.com the app keeps its own handlers (they can't be put back once replaced,
// which is why switching between Discord and an instance restarts the app)
app.on("browser-window-created", (_, win) => {
    // the client opens its own /popout window at random moments (calls, streams); on an instance it only shows a broken page
    const closePopout = (url: string) => {
        try {
            if (!isOfficial(target().url) && new URL(url).pathname === "/popout" && !win.isDestroyed()) win.close();
        } catch {
            /* not a URL */
        }
    };
    win.webContents.on("did-start-navigation", (_e, url) => closePopout(url));
    win.webContents.on("dom-ready", () => {
        closePopout(win.webContents.getURL());
        if (!isOfficial(target().url)) allowInstancePermissions(win.webContents.session);
    });
});

// the page can't write files, so screen-share clips are handed over here; only .mp4 files under the user's media folders
export async function writeClip(e: IpcMainInvokeEvent, filepath: string, data: Uint8Array) {
    if (!trusted(e.sender.getURL())) throw new Error("untrusted page");
    const target = resolve(String(filepath));
    const roots = [app.getPath("videos"), app.getPath("documents"), app.getPath("userData")].map((x) => resolve(x) + sep);
    if (extname(target).toLowerCase() !== ".mp4" || !roots.some((root) => target.startsWith(root))) throw new Error("clip path not allowed");
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, data);
}

export function getConfig(_: IpcMainInvokeEvent) {
    return get();
}

export function saveConfig(_: IpcMainInvokeEvent, next: InstanceConfig) {
    return save(next);
}

export function switchInstance(e: IpcMainInvokeEvent, index: number) {
    const before = target();
    const saved = save({ ...get(), current: index });
    const instance = saved.instances[saved.current];
    if (isOfficial(before.url) !== isOfficial(instance.url)) {
        app.relaunch();
        app.exit(0);
        return saved;
    }
    e.sender.loadURL(`${instance.url}/app`);
    return saved;
}

// Asks an instance (from here, so its CORS rules don't matter) whether it is up, and what it calls itself
export async function pingInstance(_: IpcMainInvokeEvent, raw: string) {
    const base = origin(raw);
    if (!base) return { ok: false };
    const started = Date.now();
    const get = async (path: string) => net.fetch(base + path, { signal: AbortSignal.timeout(6000), headers: { accept: "application/json" } });
    try {
        const policy = await get("/api/policies/instance/").catch(() => null);
        if (policy?.ok) {
            const body = (await policy.json().catch(() => null)) as { instanceName?: string } | null;
            return { ok: true, ms: Date.now() - started, name: body?.instanceName };
        }
        const gateway = await get("/api/v9/gateway");
        return { ok: gateway.ok, ms: Date.now() - started };
    } catch {
        return { ok: false };
    }
}
