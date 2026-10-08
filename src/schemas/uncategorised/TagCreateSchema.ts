export interface TagCreateSchema {
    name: string;
    moderated?: boolean | null;
    emoji_id?: string | null;
    emoji_name?: string | null;
}
