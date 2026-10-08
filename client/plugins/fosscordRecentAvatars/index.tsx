import definePlugin from "@utils/types";
import { React, useEffect, useRef, useState } from "@webpack/common";

import { FosscordAuthor } from "../fosscordCore/shared";
import managedStyle from "./style.css?managed";

const Chevron = ({ dir }: { dir: "left" | "right" }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" d={dir === "left" ? "M15 4 7 12l8 8" : "m9 4 8 8-8 8"} />
    </svg>
);

// one row that scrolls sideways with arrow buttons instead of a scrollbar
function AvatarRow({ children, className, ...rest }: any) {
    const list = useRef<HTMLUListElement>(null);
    const [edge, setEdge] = useState({ left: false, right: false });

    // keep the old object when nothing changed, or the effect below re-renders forever
    const update = () => {
        const el = list.current;
        if (!el) return;
        const left = el.scrollLeft > 1;
        const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
        setEdge((prev) => (prev.left === left && prev.right === right ? prev : { left, right }));
    };
    useEffect(() => {
        update();
        const el = list.current;
        if (!el || typeof ResizeObserver === "undefined") return;
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, [children]);

    const page = (dir: number) => list.current?.scrollBy({ left: dir * list.current.clientWidth * 0.8, behavior: "smooth" });

    return (
        <div className="fosscord-recent-avatars">
            {edge.left && (
                <button type="button" className="fosscord-recent-avatars-arrow fosscord-recent-avatars-left" aria-label="Scroll left" onClick={() => page(-1)}>
                    <Chevron dir="left" />
                </button>
            )}
            <ul {...rest} ref={list} className={`${className ?? ""} fosscord-recent-avatars-list`} onScroll={update}>
                {children}
            </ul>
            {edge.right && (
                <button type="button" className="fosscord-recent-avatars-arrow fosscord-recent-avatars-right" aria-label="Scroll right" onClick={() => page(1)}>
                    <Chevron dir="right" />
                </button>
            )}
        </div>
    );
}

export default definePlugin({
    name: "FosscordRecentAvatars",
    description: "Shows every recent avatar the instance has kept, not only the newest 6, in a row you scroll with arrow buttons.",
    authors: [FosscordAuthor],
    required: true,
    managedStyle,
    AvatarRow,

    patches: [
        {
            // the header says "your 6 most recent avatars" no matter how many the server sent
            find: "recentAvatarsLimit:6",
            replacement: [
                {
                    match: /(\{avatars:(\i),loading:\i,error:\i\}=.{0,700}?recentAvatarsLimit:)6/,
                    replace: "$1Math.max(6,$2.length)",
                },
                {
                    // the list of avatars becomes the scrolling row
                    match: /\("ul",\{"aria-label":(\i\.intl\.string\(\i\.t\.lsU63N\))/,
                    replace: "($self.AvatarRow,{'aria-label':$1",
                },
            ],
        },
    ],
});
