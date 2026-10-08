export interface PasswordResetSchema {
    /**
     * @minLength 1
     * @maxLength 72
     */
    password: string;
    token: string;
}
