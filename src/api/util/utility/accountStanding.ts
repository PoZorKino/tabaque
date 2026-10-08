import { Relationship, User, UserViolation } from "@spacebar/database";
import { clearTempBanCache, Config } from "@spacebar/util";
import { HTTPError } from "lambert-server/HTTPError";
import { AccountStandingState, AppealIngestionType, AppealStatusValue, Classification, ClassificationType, RelationshipType } from "@spacebar/schemas";

// a violation counts against the user until it expires, unless an appeal overturned it
export const isActiveViolation = (violation: UserViolation, now = new Date()) =>
    violation.expires_at > now && violation.appeal_status !== AppealStatusValue.CLASSIFICATION_INVALIDATED;

/**
 * The standing shown on the user's account standing page: the staff override when set, otherwise suspended for
 * disabled accounts, or one step down per active violation (1 limited, 2 very limited, 3+ at risk).
 */
export function automaticAccountStanding(user: Pick<User, "disabled">, violations: UserViolation[]): AccountStandingState {
    if (user.disabled) return AccountStandingState.SUSPENDED;
    const active = violations.filter((v) => isActiveViolation(v)).length;
    if (active === 0) return AccountStandingState.ALL_GOOD;
    if (active === 1) return AccountStandingState.LIMITED;
    if (active === 2) return AccountStandingState.VERY_LIMITED;
    return AccountStandingState.AT_RISK;
}

export const accountStanding = (user: Pick<User, "disabled" | "account_standing">, violations: UserViolation[]): AccountStandingState =>
    user.account_standing ?? automaticAccountStanding(user, violations);

// LIMITED_ACCESS, and marking an account as a spammer, mean no new DMs, friend requests or server joins while it counts
export const assertNotLimitedAccess = async (user_id: string, what: string) => {
    const limited = (await getUserViolations(user_id)).some((v) => isActiveViolation(v) && v.actions?.some((a) => a.action_type === 9 || a.action_type === 5));
    if (limited) throw new HTTPError(`Your account has limited access, so you can't ${what} right now.`, 403);
};

// when the limited-access violation counting now was issued, or null when there is none
export async function limitedSince(user_id: string): Promise<Date | null> {
    const now = new Date();
    const dates = (await getUserViolations(user_id))
        .filter((v) => isActiveViolation(v, now) && v.actions?.some((a) => a.action_type === 9 || a.action_type === 5))
        .map((v) => v.created_at);
    return dates.length ? new Date(Math.min(...dates.map((d) => d.getTime()))) : null;
}

// starting a DM while limited is only possible with friends who were friends before the restriction
export async function assertCanStartDirectMessage(user_id: string, targets: string[]) {
    const since = await limitedSince(user_id);
    if (!since) return;
    for (const target of targets) {
        const friend = await Relationship.findOne({ where: { from_id: user_id, to_id: target, type: RelationshipType.FRIEND } });
        if (!friend || friend.created_at >= since) throw new HTTPError("Your account has limited access, so you can't start new direct messages right now.", 403);
    }
}

// temporary bans last until the violation expires, so this is computed on each login rather than stored
export const hasActiveTempBan = async (user_id: string) => (await getUserViolations(user_id)).some((v) => isActiveViolation(v) && v.actions?.some((a) => a.action_type === 1));

export const getUserViolations = (user_id: string) => UserViolation.find({ where: { user_id }, order: { created_at: "DESC" } });

export const VIOLATION_TYPE_LABELS: Record<number, string> = {
    1: "Other",
    100: "Unsolicited adult content",
    200: "Non-consensual adult content",
    210: "Glorifying violence",
    220: "Hate speech",
    230: "Cracked accounts",
    240: "Illicit goods",
    250: "Social engineering",
    280: "Child safety",
    290: "Harassment and bullying",
    310: "Harassment and bullying",
    320: "Hateful conduct",
    390: "Harassment and bullying",
    711: "Impersonation",
    720: "Ban evasion",
    3010: "Malicious conduct",
    3030: "Spam",
    4000: "Non-consensual adult content",
    4010: "Fraud",
    5090: "Self-harm",
    5305: "Doxxing",
    5411: "Underage user",
    5440: "Copyright infringement",
};

// the shape discord's client renders on the account standing page
export function toClassification(violation: UserViolation): Classification {
    return {
        id: violation.id,
        classification_type: violation.classification_type,
        // the client puts this after "You broke the rules for", so it's the rule; the staff's own words go in staff_message,
        // which the patched client shows under that heading in the violation's popup
        description: VIOLATION_TYPE_LABELS[violation.classification_type] ?? VIOLATION_TYPE_LABELS[1],
        staff_message: violation.description,
        explainer_link: Config.get().general.tosPage ?? "",
        actions: violation.actions.map((action, i) => ({
            id: `${violation.id}${i}`,
            action_type: action.action_type,
            descriptions: action.descriptions,
        })),
        max_expiration_time: violation.expires_at.toISOString(),
        flagged_content: violation.flagged_content ?? [],
        // null tells the client the user can still appeal
        appeal_status: violation.appeal_status ? { status: violation.appeal_status } : null,
        is_coppa: false,
        is_spam: violation.classification_type === ClassificationType.SPAM,
        appeal_ingestion_type: AppealIngestionType.IN_APP,
    };
}

// VERIFICATION_REQUIRED: until the account verifies again, it cannot send messages. Cached briefly, this runs on every send.
const verifyCache = new Map<string, { at: number; blocked: boolean }>();
export async function assertVerifiedIfRequired(user_id: string) {
    const hit = verifyCache.get(user_id);
    let blocked = hit && Date.now() - hit.at < 30_000 ? hit.blocked : undefined;
    if (blocked === undefined) {
        const required = (await getUserViolations(user_id)).some((v) => isActiveViolation(v) && v.actions?.some((a) => a.action_type === 3));
        blocked = required && !(await User.findOne({ where: { id: user_id }, select: { id: true, verified: true } }))?.verified;
        verifyCache.set(user_id, { at: Date.now(), blocked });
    }
    if (blocked) throw new HTTPError("Verify your account to keep sending messages.", 403);
}

// called whenever a violation is issued, changed or lifted, so the change applies at once instead of after the cache expires
export function clearEnforcementCaches(user_id: string) {
    verifyCache.delete(user_id);
    clearTempBanCache(user_id);
}
