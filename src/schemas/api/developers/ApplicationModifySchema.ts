export interface ApplicationModifySchema {
    /**
     * @maxLength 400
     */
    description?: string;
    icon?: string;
    cover_image?: string;
    interactions_endpoint_url?: string | null;
    max_participants?: number | null;
    name?: string;
    /**
     * @maxLength 2048
     */
    privacy_policy_url?: string | null;
    role_connections_verification_url?: string;
    /**
     * @maxItems 5
     */
    tags?: string[];
    /**
     * @maxLength 2048
     */
    terms_of_service_url?: string | null;
    bot_public?: boolean;
    bot_require_code_grant?: boolean;
    discoverability_state?: 2 | 3;
    flags?: number;
    custom_install_url?: string | null;
    guild_id?: string;
    /**
     * @maxItems 10
     */
    redirect_uris?: string[];
    integration_types_config?: {
        "0"?: ApplicationIntegrationTypeConfig;
        "1"?: ApplicationIntegrationTypeConfig;
    };
    /*install_params?: { TODO: Validation
		scopes: string[];
		permissions: string;
	};*/
}

export interface ApplicationIntegrationTypeConfig {
    oauth2_install_params?: {
        scopes: string[];
        permissions: string;
    } | null;
}
