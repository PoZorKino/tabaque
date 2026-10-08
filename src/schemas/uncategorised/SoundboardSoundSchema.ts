import { float } from "@spacebar/schemas";

export interface SoundboardSoundCreateSchema {
    /**
     * @minLength 2
     * @maxLength 32
     */
    name: string;
    sound: string;
    /**
     * @minimum 0
     * @maximum 1
     */
    volume?: float;
    emoji_id?: string | null;
    emoji_name?: string | null;
}

export interface SoundboardSoundModifySchema {
    /**
     * @minLength 2
     * @maxLength 32
     */
    name?: string;
    /**
     * @minimum 0
     * @maximum 1
     */
    volume?: float;
    emoji_id?: string | null;
    emoji_name?: string | null;
}

export interface SendSoundboardSoundSchema {
    sound_id: string;
    source_guild_id?: string | null;
    emoji_id?: string | null;
    emoji_name?: string | null;
}
