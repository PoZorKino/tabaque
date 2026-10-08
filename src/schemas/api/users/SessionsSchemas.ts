import { ActivitySchema, ClientStatus, Snowflake } from "@spacebar/schemas";

export type SessionsLogoutSchema = { session_ids?: Snowflake[]; session_id_hashes?: string[] };
export type GetSessionsResponse = { user_sessions: DeviceInfo[] };

export type DeviceInfo = {
    id: string;
    id_hash: string;
    status: string;
    activities: ActivitySchema["activities"][];
    client_status: ClientStatus;
    approx_last_used_time: string;
    client_info: {
        client: string;
        os: string;
        version: number;
        location: string;
    };
    last_seen?: Date;
    last_seen_ip?: string;
    last_seen_location?: string;
};
