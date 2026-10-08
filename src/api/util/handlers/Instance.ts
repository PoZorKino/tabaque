import { getDatabase } from "@spacebar/database";
import { ProcessLifecycle } from "../../../util/util/ProcessLifecycle";

let timer: NodeJS.Timeout | undefined;
let pruning: Promise<void> | undefined;
let stopping = false;

export function pruneTemporarySessions() {
    if (stopping) return pruning ?? Promise.resolve();
    if (pruning) return pruning;
    pruning = (async () => {
        const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        await getDatabase()!.query(
            `DELETE FROM "sessions" WHERE "session_id" IN (
                SELECT "session_id" FROM "sessions" WHERE "last_seen" = '1970-01-01 00:00:00' AND "created_at" < $1::timestamp
                ORDER BY "created_at", "session_id" LIMIT 500 FOR UPDATE SKIP LOCKED
            ) AND "last_seen" = '1970-01-01 00:00:00' AND "created_at" < $1::timestamp`,
            [cutoff],
        );
    })().finally(() => {
        pruning = undefined;
    });
    return pruning;
}

export async function initInstance() {
    if (timer || stopping) return;
    timer = setInterval(() => void pruneTemporarySessions().catch((error) => console.error("[Instance] Temporary session cleanup failed", error)), 5 * 60 * 1000);
    timer.unref();
    ProcessLifecycle.eventEmitter.once("stopping", async () => {
        stopping = true;
        clearInterval(timer);
        await Promise.allSettled(pruning ? [pruning] : []);
    });
}
