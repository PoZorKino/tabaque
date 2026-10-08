export interface MessageThreadCreationSchema {
    auto_archive_duration?: number;
    rate_limit_per_user?: number;
    name: string;
    location?: string; //ignore it
    type?: number;
}
