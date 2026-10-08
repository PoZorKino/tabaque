import { Column, Entity, JoinColumn, ManyToOne, Index } from "typeorm";
import { BaseClass } from "./BaseClass";

@Entity({
    name: "recipients",
})
export class Recipient extends BaseClass {
    @Column()
    @Index("IDX_recipients_channel_id")
    channel_id: string;

    @JoinColumn({ name: "channel_id", foreignKeyConstraintName: "FK_recipient_channel_id" })
    @ManyToOne(() => require("./Channel").Channel, {
        onDelete: "CASCADE",
    })
    channel: import("./Channel").Channel;

    @Column()
    @Index("IDX_recipients_user_id")
    user_id: string;

    @JoinColumn({ name: "user_id", foreignKeyConstraintName: "FK_recipient_user_id" })
    @ManyToOne(() => require("./User").User, {
        onDelete: "CASCADE",
    })
    user: import("./User").User;

    @Column({ default: false })
    closed: boolean;

    @Column({ nullable: true, type: Date })
    message_request_timestamp?: Date | null;

    // TODO: settings/mute/nick/added at/encryption keys/read_state
}
