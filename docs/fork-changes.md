# Changes on top of upstream

Base: upstream `m4rcel-lol/fosscord-server` at commit c302ca4 (that repository is no longer public).
When the upstream alpha is published again, rebase or port these commits onto it.

- Admin: percentage rollouts for experiments, audit log, What's New editor, registration requests.
- Moderation: violations that take effect (warning, limited access, quarantine, temp ban, ban, hidden messages, username/profile reset, spammer, verification), appeals and reverts.
- Official account: read-only DMs, plain unencrypted notices rendered as Discord safety cards.
- What's New: `changelogs` table, `/changelogs` CDN route, admin editor.
- Search: Ctrl+F global search across DMs, group DMs, joined and discoverable servers, with `@dm`/`@server`/`@discover` scopes and a Filters dialog.
- Help center (`/hc`, admin tab) — present in the code, not deployed on the main instance.
- Client plugins in `client/plugins` (desktop, instances switcher, safety cards, limited access, recent avatars, global search, help).
- Legal pages (terms with a no-KYC rule), ops scripts in `scripts/ops` (backup, restore test, predeploy checks).

Secrets (`.env`, `config.json`, `jwt.key*`, `.e2ee-*`) are git-ignored; generate your own.
