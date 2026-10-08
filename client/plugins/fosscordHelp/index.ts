import definePlugin from "@utils/types";

import { FosscordAuthor } from "../fosscordCore/shared";

export default definePlugin({
    name: "FosscordHelp",
    description: "Sends the client's support links to this instance's help center (/hc) instead of Discord's.",
    authors: [FosscordAuthor],
    required: true,

    patches: [
        {
            // every support link in the client; /hc is relative, so it works on any instance host
            find: "support.discord.com/hc",
            all: true,
            replacement: {
                match: /https:\/\/support\.discord\.com\/hc/g,
                replace: "/hc",
            },
        },
    ],
});
