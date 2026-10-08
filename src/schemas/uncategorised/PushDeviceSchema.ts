export interface PushDeviceSchema {
    provider: string;
    token: string;
    voip_provider?: string | null;
    voip_token?: string | null;
    bypass_server_throttling_supported?: boolean;
    bundle_id?: string | null;
}
