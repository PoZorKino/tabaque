/* SPDX-License-Identifier: AGPL-3.0-only */
import crypto from "node:crypto";

export type MfaAttemptStore = { query: (sql: string, parameters?: unknown[]) => Promise<unknown[]> };

export async function reserveMfaAttempt(store: MfaAttemptStore, ticket: string, expires: number) {
    const hash = crypto.createHash("sha256").update(ticket).digest("hex");
    await store.query(`DELETE FROM "mfa_ticket_attempts" WHERE "ticket_hash" IN
        (SELECT "ticket_hash" FROM "mfa_ticket_attempts" WHERE "expires_at" < CURRENT_TIMESTAMP ORDER BY "expires_at" LIMIT 100)`);
    const rows = await store.query(
        `WITH reserved AS (INSERT INTO "mfa_ticket_attempts" ("ticket_hash", "attempts", "consumed", "expires_at") VALUES ($1, 1, false, $2)
        ON CONFLICT ("ticket_hash") DO UPDATE SET "attempts" = "mfa_ticket_attempts"."attempts" + 1
        WHERE "mfa_ticket_attempts"."attempts" < 5 AND NOT "mfa_ticket_attempts"."consumed"
            AND "mfa_ticket_attempts"."expires_at" > CURRENT_TIMESTAMP RETURNING "ticket_hash") SELECT "ticket_hash" FROM reserved`,
        [hash, new Date(expires)],
    );
    return rows.length ? hash : null;
}

export async function consumeMfaTicket(store: MfaAttemptStore, hash: string) {
    const rows = await store.query(
        `WITH consumed AS (UPDATE "mfa_ticket_attempts" SET "consumed" = true WHERE "ticket_hash" = $1
        AND NOT "consumed" AND "expires_at" > CURRENT_TIMESTAMP RETURNING "ticket_hash") SELECT "ticket_hash" FROM consumed`,
        [hash],
    );
    return rows.length === 1;
}
