import { Column, Entity, PrimaryColumn } from "typeorm";
import { BaseClassWithoutId } from "./BaseClass";

// one "What's new" entry, shown in the client's changelog window
@Entity({ name: "changelogs" })
export class Changelog extends BaseClassWithoutId {
    // time-ordered: the client decides which entry is newer by comparing ids
    @PrimaryColumn()
    id: string;

    // YYYY-MM-DD, the day the entry is about
    @Column()
    date: string;

    // a title line underlined with =====, then the text
    @Column({ type: "text" })
    content: string;

    // 0 is a YouTube video id, 1 is an image url
    @Column({ type: "int", nullable: true })
    asset_type: number | null;

    @Column({ type: "varchar", nullable: true })
    asset: string | null;

    // pops up when people open the app, instead of only being listed in settings
    @Column({ default: true })
    show_on_startup: boolean;

    // drafts are not served to the client
    @Column({ default: true })
    published: boolean;
}
