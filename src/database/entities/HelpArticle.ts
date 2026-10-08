import { Column, Entity, PrimaryColumn } from "typeorm";
import { BaseClassWithoutId } from "./BaseClass";

// a help center article: mirrored from Discord's help center (source "discord") or written on this instance ("custom")
@Entity({ name: "help_articles" })
export class HelpArticle extends BaseClassWithoutId {
    // Discord's article id for mirrored articles, a generated id for custom ones
    @PrimaryColumn()
    id: string;

    @Column()
    title: string;

    @Column({ type: "text", default: "" })
    body: string;

    @Column({ default: "custom" })
    source: string;

    @Column({ type: "int", default: 0 })
    position: number;

    @Column({ type: "timestamp", default: () => "now()" })
    updated_at: Date;
}
