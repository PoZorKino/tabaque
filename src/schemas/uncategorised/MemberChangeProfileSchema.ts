export interface MemberChangeProfileSchema {
    banner?: string | null;
    nick?: string | null;
    bio?: string | null;
    pronouns?: string | null;
    theme_colors?: number[] | null;
    accent_color?: number | null;
    profile_effect_id?: string | null;
    collectibles_sku_ids?: string[] | null;
    popout_animation_particle_type?: string | null;
    emoji_id?: string | null;
}
