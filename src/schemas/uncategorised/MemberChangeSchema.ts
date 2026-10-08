export interface MemberChangeSchema {
    roles?: string[];
    /**
     * @maxLength 32
     */
    nick?: string | null;
    avatar?: string | null;
    bio?: string;
    communication_disabled_until?: string | null;
    channel_id?: string | null;
    avatar_description?: string | null;
    avatar_id?: string | null;
    avatar_decoration_sku_id?: string | null;
    collectibles?: { nameplate: { sku_id: string } | null } | null;
    display_name_font_id?: number | null;
    display_name_effect_id?: number | null;
    display_name_colors?: number[] | null;
    vad_colors?: number[] | null;
    mute?: boolean;
    deaf?: boolean;
}
