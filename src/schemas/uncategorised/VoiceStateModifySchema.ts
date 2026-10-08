export interface VoiceStateModifySchema {
    channel_id?: string;
    suppress?: boolean;
    request_to_speak_timestamp?: string | null;
    silent?: boolean;
    self_video?: boolean;
    self_stream?: boolean;
}
