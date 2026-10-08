import definePlugin from "@utils/types";

import { FosscordAuthor } from "../fosscordCore/shared";

export default definePlugin({
    name: "FosscordNotifications",
    description: "Asks the browser for notification permission when desktop notifications are turned on.",
    authors: [FosscordAuthor],
    required: true,

    requestPermission(desktopType: string) {
        if (desktopType !== "ALL" || !("Notification" in window) || Notification.permission !== "default") return;
        Notification.requestPermission().catch(() => {});
    },

    patches: [
        {
            find: 'type:"NOTIFICATIONS_SET_DESKTOP_TYPE",desktopType:',
            replacement: {
                match: /setDesktopType\((\i)\)\{/,
                replace: "$&$self.requestPermission($1);",
            },
        },
    ],
});
