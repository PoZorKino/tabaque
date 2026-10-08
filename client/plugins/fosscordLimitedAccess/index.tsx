import definePlugin from "@utils/types";
import { RestAPI } from "@webpack/common";

import { FosscordAuthor } from "../fosscordCore/shared";

// a banner the client can't dismiss while the account has limited access, like Discord's
let banner: HTMLDivElement | null = null;

async function showIfLimited() {
    try {
        const { body } = await RestAPI.get({ url: "/users/@me/limited-access" });
        if (!body?.limited || banner) return;
        banner = document.createElement("div");
        banner.setAttribute("role", "status");
        banner.textContent = "Your account has limited access. Something looks off, so some actions are restricted. Mistakes can happen.";
        Object.assign(banner.style, {
            position: "fixed",
            top: "0",
            left: "0",
            right: "0",
            zIndex: "99999",
            padding: "10px 16px",
            background: "#f0b132",
            color: "#1e1f22",
            font: "600 14px/1.4 system-ui, sans-serif",
            textAlign: "center",
        });
        document.body.appendChild(banner);
    } catch {
        // the banner is informational; a failed check shouldn't break the client
    }
}

export default definePlugin({
    name: "FosscordLimitedAccess",
    description: "Shows a banner while this instance has limited the account's access.",
    authors: [FosscordAuthor],
    required: true,

    start() {
        showIfLimited();
    },

    stop() {
        banner?.remove();
        banner = null;
    },
});
