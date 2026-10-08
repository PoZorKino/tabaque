import { Column, Entity, PrimaryColumn } from "typeorm";
import { BaseClassWithoutId } from "./BaseClass";

// A signup waiting for an operator's decision. The account is only created when it is approved.
@Entity({ name: "registration_requests" })
export class RegistrationRequest extends BaseClassWithoutId {
    @PrimaryColumn()
    id: string;

    @Column()
    username: string;

    @Column({ type: "varchar", nullable: true })
    email: string | null;

    // already hashed
    @Column({ type: "varchar", nullable: true })
    password: string | null;

    @Column({ type: "varchar", nullable: true })
    date_of_birth: string | null;

    @Column({ type: "varchar", nullable: true })
    invite: string | null;

    @Column({ type: "varchar", nullable: true })
    ip: string | null;

    @Column({ type: "varchar", nullable: true })
    message: string | null;

    // pending | approved | rejected
    @Column({ default: "pending" })
    status: string;

    @Column({ type: "timestamp with time zone" })
    created_at: Date;

    @Column({ type: "timestamp with time zone", nullable: true })
    decided_at: Date | null;

    @Column({ type: "varchar", nullable: true })
    decided_by: string | null;

    @Column({ type: "varchar", nullable: true })
    user_id: string | null;
}
