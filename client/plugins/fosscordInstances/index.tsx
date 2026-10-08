/*
 * Instance manager: switch which backend this app talks to (a Fosscord instance, or Discord itself).
 * One source for both builds: the Fosscord web bundle (any browser, any instance) and the desktop Equicord that
 * runs on discord.com. In the desktop app the list lives in the main process (native.ts); in a browser it is
 * kept in localStorage and switching just navigates.
 * AGPL-3.0-or-later
 */

import "./styles.css";

import { Button } from "@components/Button";
import ErrorBoundary from "@components/ErrorBoundary";
import definePlugin from "@utils/types";
import { createRoot, React, Tooltip } from "@webpack/common";

interface Instance {
    name: string;
    url: string;
}
interface InstanceConfig {
    current: number;
    instances: Instance[];
    blockServerMod?: boolean;
}
interface Ping {
    ok: boolean;
    ms?: number;
    name?: string;
}
interface Bridge {
    getConfig(): Promise<InstanceConfig>;
    saveConfig(config: InstanceConfig): Promise<InstanceConfig>;
    switchInstance(index: number): Promise<InstanceConfig>;
    pingInstance(url: string): Promise<Ping>;
}

const bridge = () => (window as any).VencordNative?.pluginHelpers?.FosscordInstances as Bridge | undefined;

const DISCORD_PRESETS: Instance[] = [
    { name: "Discord", url: "https://discord.com" },
    { name: "Discord PTB", url: "https://ptb.discord.com" },
    { name: "Discord Canary", url: "https://canary.discord.com" },
];

const originOf = (raw: string) => {
    try {
        const input = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw.trim()) ? raw.trim() : `https://${raw.trim()}`;
        const url = new URL(input);
        return url.protocol === "http:" || url.protocol === "https:" ? url.origin : null;
    } catch {
        return null;
    }
};

// --- storage: the desktop shell when there is one, this browser otherwise -------------------------------------------

const BROWSER_KEY = "FosscordInstances";

function browserConfig(): InstanceConfig {
    let stored: InstanceConfig | undefined;
    try {
        stored = JSON.parse(localStorage.getItem(BROWSER_KEY) || "null") ?? undefined;
    } catch {
        /* start fresh */
    }
    const here: Instance = { name: location.host, url: location.origin };
    const instances = stored?.instances?.length ? stored.instances : [here, DISCORD_PRESETS[0]];
    if (!instances.some((x) => x.url === here.url)) instances.unshift(here);
    return {
        current: Math.max(
            0,
            instances.findIndex((x) => x.url === here.url),
        ),
        instances,
    };
}

const store = {
    desktop: () => !!bridge(),
    async load(): Promise<InstanceConfig> {
        return bridge() ? bridge()!.getConfig() : browserConfig();
    },
    async save(config: InstanceConfig): Promise<InstanceConfig> {
        if (bridge()) return bridge()!.saveConfig(config);
        localStorage.setItem(BROWSER_KEY, JSON.stringify(config));
        return config;
    },
    async open(config: InstanceConfig, index: number) {
        const target = config.instances[index];
        if (bridge()) return void (await bridge()!.switchInstance(index));
        location.assign(`${target.url}/app`);
    },
    async ping(url: string): Promise<Ping> {
        if (bridge()) return bridge()!.pingInstance(url);
        const started = Date.now();
        try {
            const res = await fetch(`${url}/api/policies/instance/`, { signal: AbortSignal.timeout(6000) });
            if (res.ok) return { ok: true, ms: Date.now() - started, name: (await res.json().catch(() => null))?.instanceName };
        } catch {
            /* try the plain gateway next, or give up */
        }
        try {
            const res = await fetch(`${url}/api/v9/gateway`, { signal: AbortSignal.timeout(6000) });
            return { ok: res.ok, ms: Date.now() - started };
        } catch {
            return { ok: url === location.origin };
        }
    },
};

// --- UI ------------------------------------------------------------------------------------------------------------

function StatusDot({ ping }: { ping?: Ping }) {
    const state = !ping ? "checking" : ping.ok ? "online" : "offline";
    const label = state === "checking" ? "Checking…" : state === "online" ? `Online${ping?.ms != null ? ` · ${ping.ms} ms` : ""}` : "Not reachable";
    return <span className={`fi-dot fi-dot-${state}`} title={label} />;
}

function InstanceManager({ onClose }: { onClose(): void }) {
    const [config, setConfig] = React.useState<InstanceConfig | null>(null);
    const [pings, setPings] = React.useState<Record<string, Ping>>({});
    const [busy, setBusy] = React.useState<number | null>(null);
    const [editing, setEditing] = React.useState<number | null>(null);
    const [draft, setDraft] = React.useState<Instance>({ name: "", url: "" });
    const [fresh, setFresh] = React.useState<Instance>({ name: "", url: "" });
    const [error, setError] = React.useState("");

    const check = (urls: string[]) => urls.forEach((url) => store.ping(url).then((ping) => setPings((old) => ({ ...old, [url]: ping }))));

    React.useEffect(() => {
        store.load().then((loaded) => {
            setConfig(loaded);
            check(loaded.instances.map((x) => x.url));
        });
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey, true);
        return () => document.removeEventListener("keydown", onKey, true);
    }, []);

    if (!config) return null;

    const commit = async (next: InstanceConfig) => setConfig(await store.save(next));

    const connect = async (index: number) => {
        setBusy(index);
        try {
            await store.open(config, index);
        } finally {
            setTimeout(() => setBusy(null), 4000);
        }
    };

    const add = async (candidate: Instance) => {
        const url = originOf(candidate.url);
        if (!url) return setError("That doesn't look like an address. Try https://my.instance");
        if (config.instances.some((x) => x.url === url)) return setError("That instance is already in the list.");
        const found = await store.ping(url);
        const name = (candidate.name.trim() || found.name || new URL(url).host).slice(0, 40);
        setError("");
        setFresh({ name: "", url: "" });
        await commit({ ...config, instances: [...config.instances, { name, url }] });
        setPings((old) => ({ ...old, [url]: found }));
    };

    const remove = async (index: number) => {
        if (config.instances.length <= 1 || index === config.current) return;
        const instances = config.instances.filter((_, i) => i !== index);
        await commit({ ...config, instances, current: index < config.current ? config.current - 1 : config.current });
    };

    const saveEdit = async () => {
        const url = originOf(draft.url);
        if (editing == null || !url || !draft.name.trim()) return setError("Both a name and a valid address are needed.");
        const instances = config.instances.map((x, i) => (i === editing ? { name: draft.name.trim().slice(0, 40), url } : x));
        setError("");
        setEditing(null);
        await commit({ ...config, instances });
        check([url]);
    };

    const missing = DISCORD_PRESETS.filter((p) => !config.instances.some((x) => x.url === p.url));

    return (
        <div className="fi-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div className="fi-card" role="dialog" aria-label="Instances">
                <header className="fi-head">
                    <div>
                        <h2>Instances</h2>
                        <p>Choose the backend this app connects to. Each one keeps its own login.</p>
                    </div>
                    <button className="fi-x" aria-label="Close" onClick={onClose}>
                        ✕
                    </button>
                </header>

                <ul className="fi-list">
                    {config.instances.map((instance, index) => {
                        const current = index === config.current;
                        return (
                            <li key={instance.url} className={"fi-row" + (current ? " fi-current" : "")}>
                                {editing === index ? (
                                    <div className="fi-edit">
                                        <input value={draft.name} placeholder="Name" maxLength={40} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                                        <input value={draft.url} placeholder="https://my.instance" onChange={(e) => setDraft({ ...draft, url: e.target.value })} />
                                        <Button size="small" onClick={saveEdit}>
                                            Save
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="secondary"
                                            onClick={() => {
                                                setEditing(null);
                                                setError("");
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <StatusDot ping={pings[instance.url]} />
                                        <div className="fi-info">
                                            <div className="fi-name">
                                                {instance.name}
                                                {current && <span className="fi-tag">Connected</span>}
                                            </div>
                                            <div className="fi-url">{instance.url}</div>
                                        </div>
                                        <div className="fi-actions">
                                            {!current && (
                                                <Button size="small" disabled={busy != null} onClick={() => connect(index)}>
                                                    {busy === index ? "Connecting…" : "Connect"}
                                                </Button>
                                            )}
                                            <Button
                                                size="small"
                                                variant="secondary"
                                                onClick={() => {
                                                    setEditing(index);
                                                    setDraft(instance);
                                                    setError("");
                                                }}
                                            >
                                                Edit
                                            </Button>
                                            {!current && config.instances.length > 1 && (
                                                <Button size="small" variant="dangerSecondary" onClick={() => remove(index)}>
                                                    Remove
                                                </Button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </li>
                        );
                    })}
                </ul>

                <section className="fi-add">
                    <h3>Add an instance</h3>
                    <div className="fi-edit">
                        <input
                            value={fresh.url}
                            placeholder="https://my.instance"
                            onChange={(e) => setFresh({ ...fresh, url: e.target.value })}
                            onKeyDown={(e) => e.key === "Enter" && add(fresh)}
                        />
                        <input
                            value={fresh.name}
                            placeholder="Name (optional)"
                            maxLength={40}
                            onChange={(e) => setFresh({ ...fresh, name: e.target.value })}
                            onKeyDown={(e) => e.key === "Enter" && add(fresh)}
                        />
                        <Button size="small" onClick={() => add(fresh)}>
                            Add
                        </Button>
                    </div>
                    {missing.length > 0 && (
                        <div className="fi-presets">
                            {missing.map((p) => (
                                <button key={p.url} className="fi-chip" onClick={() => add(p)}>
                                    + {p.name}
                                </button>
                            ))}
                        </div>
                    )}
                    {error && <p className="fi-error">{error}</p>}
                </section>

                <footer className="fi-foot">
                    <span>{store.desktop() ? "Switching between Discord and an instance restarts the app." : "Switching opens the instance in this tab."}</span>
                    <span>Ctrl+Alt+I</span>
                </footer>
            </div>
        </div>
    );
}

// --- mounting ------------------------------------------------------------------------------------------------------

let host: HTMLElement | null = null;
let root: ReturnType<typeof createRoot> | null = null;

function closeManager() {
    root?.unmount();
    host?.remove();
    root = host = null;
}

function openManager() {
    if (host) return;
    host = document.createElement("div");
    host.id = "fosscord-instances";
    document.body.append(host);
    root = createRoot(host);
    root.render(
        <ErrorBoundary noop onError={closeManager}>
            <InstanceManager onClose={closeManager} />
        </ErrorBoundary>,
    );
}

function onKeyDown(e: KeyboardEvent) {
    if (e.ctrlKey && e.altKey && e.code === "KeyI") {
        e.preventDefault();
        host ? closeManager() : openManager();
    }
}

function SwitcherButton() {
    return (
        <div className="fi-button-wrap">
            <Tooltip text="Instances (Ctrl+Alt+I)" position="right">
                {({ onMouseEnter, onMouseLeave }) => (
                    <button className="fi-button" aria-label="Instances" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onClick={openManager}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M7 7h11l-3-3M17 17H6l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                )}
            </Tooltip>
        </div>
    );
}

// The server list API patches don't fit every client build, so the button is placed into the list's own scroller and
// put back whenever the list re-renders
let slot: HTMLElement | null = null;
let slotRoot: ReturnType<typeof createRoot> | null = null;
let observer: MutationObserver | null = null;
let queued = false;

function placeButton() {
    queued = false;
    const scroller = document.querySelector<HTMLElement>('[data-list-id="guildsnav"] > [class*="scroller"]') ?? document.querySelector<HTMLElement>('[data-list-id="guildsnav"]');
    if (!scroller) return;
    if (!slot) {
        slot = document.createElement("div");
        slot.id = "fosscord-instances-button";
        slotRoot = createRoot(slot);
        slotRoot.render(
            <ErrorBoundary noop>
                <SwitcherButton />
            </ErrorBoundary>,
        );
    }
    if (slot.parentElement !== scroller || scroller.lastElementChild !== slot) scroller.append(slot);
}

const schedule = () => {
    if (!queued) {
        queued = true;
        requestAnimationFrame(placeButton);
    }
};

export default definePlugin({
    name: "FosscordInstances",
    description: "Switch between Fosscord instances and Discord itself. Button at the bottom of the server list, or Ctrl+Alt+I.",
    authors: [{ name: "dexx", id: 0n }],
    required: true,

    settingsAboutComponent: () => <Button onClick={openManager}>Open the instance manager</Button>,

    start() {
        document.addEventListener("keydown", onKeyDown);
        observer = new MutationObserver(schedule);
        observer.observe(document.body, { childList: true, subtree: true });
        schedule();
    },
    stop() {
        document.removeEventListener("keydown", onKeyDown);
        observer?.disconnect();
        slotRoot?.unmount();
        slot?.remove();
        slot = slotRoot = observer = null;
        closeManager();
    },
});
