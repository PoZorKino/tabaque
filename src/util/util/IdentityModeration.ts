import { Config } from "./Config";
import { FieldErrors } from "./FieldError";

export const defaultIdentityBlockedTerms = ["nigger", "nigga", "faggot", "fag", "kike", "chink", "spic", "wetback", "tranny"];

const substitutions: Record<string, string> = {
    "0": "o",
    "1": "i",
    "3": "e",
    "4": "a",
    "5": "s",
    "7": "t",
    "@": "a",
    $: "s",
};

export function normalizeIdentityName(value: string) {
    return value
        .normalize("NFKC")
        .toLowerCase()
        .replace(/\p{Cf}/gu, "")
        .replace(/[013457@$]/g, (character) => substitutions[character]);
}

export function isIdentityNameBlocked(value: string, terms: readonly string[] = defaultIdentityBlockedTerms) {
    const variants = [
        value
            .normalize("NFKC")
            .toLowerCase()
            .replace(/\p{Cf}/gu, ""),
        normalizeIdentityName(value),
    ];
    return terms.slice(0, 256).some((term) => {
        const normalizedTerm = normalizeIdentityName(term.trim());
        if (!normalizedTerm || normalizedTerm.length > 64 || !/^[\p{L}\p{N}]+$/u.test(normalizedTerm)) return false;
        const pattern = Array.from(normalizedTerm)
            .map((character) => character.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
            .join("[\\p{P}\\p{Z}\\s]*");
        const matcher = new RegExp(`(?:^|[^\\p{L}])${pattern}(?:$|[^\\p{L}])`, "u");
        return variants.some((normalized) => matcher.test(normalized));
    });
}

export function assertIdentityNameAllowed(value: string | null | undefined, field = "username") {
    if (!value) return;
    if (isIdentityNameBlocked(value, Config.get().user.identityBlockedTerms ?? defaultIdentityBlockedTerms))
        throw FieldErrors({
            [field]: {
                code: "NAME_NOT_ALLOWED",
                message: "Choose a different name. This name is not allowed on this instance.",
            },
        });
}
