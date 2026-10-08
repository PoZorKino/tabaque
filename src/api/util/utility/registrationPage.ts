export const page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Signup requests</title>
<style>
:root{color-scheme:dark;--bg:#1e1f22;--card:#2b2d31;--text:#f2f3f5;--muted:#b5bac1;--ok:#23a559;--bad:#f23f43;--accent:#5865f2}
body{margin:0;background:var(--bg);color:var(--text);font:15px/1.4 system-ui,sans-serif}
main{max-width:760px;margin:0 auto;padding:24px 16px}
h1{font-size:20px;margin:0 0 4px}.sub{color:var(--muted);margin:0 0 20px}
.card{background:var(--card);border-radius:10px;padding:14px 16px;margin-bottom:10px;display:flex;gap:12px;align-items:center;flex-wrap:wrap}
.who{flex:1;min-width:200px}.who b{font-size:16px}.meta{color:var(--muted);font-size:13px;word-break:break-all}
button{border:0;border-radius:6px;padding:8px 14px;font:inherit;color:#fff;cursor:pointer}
.ok{background:var(--ok)}.bad{background:var(--bad)}button:disabled{opacity:.5;cursor:default}
.tag{font-size:12px;padding:2px 8px;border-radius:99px;background:#3b3d44;color:var(--muted)}
.empty,.err{color:var(--muted);padding:24px 0}.err{color:var(--bad)}
h2{font-size:14px;color:var(--muted);margin:24px 0 8px;text-transform:uppercase;letter-spacing:.04em}
</style></head><body><main>
<h1>Signup requests</h1><p class="sub" id="sub">Loading...</p><div id="out"></div>
<script>
const out = document.getElementById("out"), sub = document.getElementById("sub");
let token = null;
try { token = JSON.parse(localStorage.getItem("token")); } catch (e) { token = localStorage.getItem("token"); }
const api = async (path, method) => {
  const r = await fetch("/api/v9/admin/registrations" + path, { method: method || "GET", headers: { Authorization: token } });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body.message || r.status);
  return body;
};
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const when = (d) => new Date(d).toLocaleString();
async function load() {
  if (!token) { sub.textContent = ""; out.replaceChildren(el("p", "err", "Sign in to this site first, then reload this page.")); return; }
  let data;
  try { data = await api("/"); } catch (e) { sub.textContent = ""; out.replaceChildren(el("p", "err", "Couldn't load: " + e.message + " (you need operator rights)")); return; }
  sub.textContent = data.require_approval ? "Approval is on: new signups wait here." : "Approval is off: signups create accounts right away.";
  const pending = data.requests.filter((r) => r.status === "pending"), done = data.requests.filter((r) => r.status !== "pending");
  out.replaceChildren(el("h2", null, "Waiting (" + pending.length + ")"));
  if (!pending.length) out.append(el("p", "empty", "Nothing waiting."));
  for (const r of pending) {
    const card = el("div", "card"), who = el("div", "who");
    who.append(el("b", null, r.username), el("div", "meta", [r.email, r.ip, when(r.created_at)].filter(Boolean).join(" - ")));
    const yes = el("button", "ok", "Approve"), no = el("button", "bad", "Decline");
    const act = (kind) => async () => { yes.disabled = no.disabled = true; try { await api("/" + r.id + "/" + kind, "POST"); await load(); } catch (e) { alert(e.message); yes.disabled = no.disabled = false; } };
    yes.onclick = act("approve"); no.onclick = act("reject");
    card.append(who, yes, no); out.append(card);
  }
  if (done.length) out.append(el("h2", null, "Decided"));
  for (const r of done) {
    const card = el("div", "card"), who = el("div", "who");
    who.append(el("b", null, r.username), el("div", "meta", [r.email, r.decided_at && when(r.decided_at)].filter(Boolean).join(" - ")));
    card.append(who, el("span", "tag", r.status)); out.append(card);
  }
}
load();
</script></main></body></html>`;
