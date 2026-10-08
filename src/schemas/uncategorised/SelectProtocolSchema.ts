export interface SelectProtocolSchema {
    protocol: "webrtc" | "udp";
    data:
        | string
        | {
              address: string;
              port: number;
              mode: string;
          };
    sdp?: string;
    codecs?: {
        name: string;
        type: "audio" | "video";
        priority: number;
        payload_type: number;
        rtx_payload_type?: number;
    }[];
    rtc_connection_id?: string; // uuid
    experiments?: string[];
}
