export interface VoiceIdentifySchema {
    server_id: string;
    user_id: string;
    session_id: string;
    channel_id?: string;
    token: string;
    video?: boolean;
    streams?: {
        type: "video" | "audio" | "screen";
        rid: string;
        quality: number;
    }[];
    max_secure_frames_version?: number; // pre-release Dave max version field
    max_dave_protocol_version?: number; // final Dave max version field
}
