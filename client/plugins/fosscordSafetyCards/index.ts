import definePlugin from "@utils/types";

import { FosscordAuthor } from "../fosscordCore/shared";
import managedStyle from "./style.css?managed";

export default definePlugin({
    name: "FosscordSafetyCards",
    description: "Fixes how the official account's safety cards look: icon spacing, bar colors and link text.",
    authors: [FosscordAuthor],
    required: true,
    managedStyle,
});
