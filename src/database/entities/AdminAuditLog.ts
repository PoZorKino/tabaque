import { Column, Entity, PrimaryColumn } from "typeorm";
import { BaseClassWithoutId } from "./BaseClass";

// one row per successful write to the admin API: who did it, what it touched, and a redacted copy of the request
@Entity({ name: "admin_audit_logs" })
export class AdminAuditLog extends BaseClassWithoutId {
    @PrimaryColumn()
    id: string;

    @Column()
    actor_id: string;

    @Column()
    method: string;

    // the request path without the api version prefix
    @Column()
    path: string;

    // first segment after /admin, e.g. users, experiments, help
    @Column()
    area: string;

    // the first id in the path, usually the user or guild the change was about
    @Column({ type: "varchar", nullable: true })
    target_id: string | null;

    @Column({ type: "int" })
    status: number;

    @Column({ type: "jsonb", nullable: true })
    body: Record<string, unknown> | null;

    @Column({ type: "timestamp", default: () => "now()" })
    created_at: Date;
}
