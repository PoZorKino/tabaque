import { PartialUser, Snowflake } from "@spacebar/schemas";

export type PublicAvatarDecorationListResponse = PublicAvatarDecorationResponse[];
export type PrivateAvatarDecorationListResponse = PrivateAvatarDecorationResponse[];
export interface PublicAvatarDecorationResponse {
    id: Snowflake;
    approved: boolean;
    uploader: PartialUser;
    public: boolean;
    available: boolean;
}

export interface PrivateAvatarDecorationResponse extends PublicAvatarDecorationResponse {
    allowed_user_ids: Snowflake[];
    allowed_guild_ids: Snowflake[];
    allowed_role_ids: Snowflake[];
}

export interface UpdateAvatarDecorationSchema {
    public?: boolean;
    allowed_user_ids?: { add?: Snowflake[]; remove?: Snowflake[] };
    allowed_guild_ids?: { add?: Snowflake[]; remove?: Snowflake[] };
    allowed_role_ids?: { add?: Snowflake[]; remove?: Snowflake[] };
}
