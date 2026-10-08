import definePlugin, { StartAt } from "@utils/types";

import { FosscordAuthor } from "../fosscordCore/shared";
import managedStyle from "./style.css?managed";

type Platform = { name?: string; version?: string; ua?: string };

export default definePlugin({
    name: "FosscordMobileWeb",
    description:
        "Keeps phone browsers in the web client: invite and template links open here instead of handing off to the Discord app, and voice works in Chrome, Firefox, Opera and Samsung Internet on phones.",
    authors: [FosscordAuthor],
    required: true,
    managedStyle,
    startAt: StartAt.DOMContentLoaded,

    patches: [
        {
            find: '"guild_template_mobile"',
            replacement: [
                {
                    match: /\i\.Fr\|\|\i\.v1(?=\?\(0,\i\.jsx\)\(\i,\{inviteKey:\i,transitionTo:\i\},\i\))/,
                    replace: "!1",
                },
                {
                    match: /\i\.Fr\|\|\i\.v1(?=\?\(0,\i\.jsx\)\(\i,\{code:\i\},\i\))/,
                    replace: "!1",
                },
            ],
        },
        {
            find: /"OculusBrowser"\)>-1,\i=\(\(\)=>/,
            replacement: {
                match: /(\i)=(\i\.n\(\i\));(?=let \i=parseInt\(\1\(\)\.version)/,
                replace: "$1=(g=>()=>$self.browser(g()))($2);",
            },
        },
    ],

    browser(platform: Platform) {
        const name = platform.name?.replace(/ Mobile$/, "");
        if (name !== "Samsung Internet") return { ...platform, name };
        return {
            ...platform,
            name: "Chrome",
            version: /Chrome\/([\d.]+)/.exec(platform.ua ?? "")?.[1] ?? platform.version,
        };
    },
});
