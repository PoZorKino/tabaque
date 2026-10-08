export interface UploadAttachmentRequestSchema {
    files: UploadAttachmentRequest[];
}

export interface UploadAttachmentRequest {
    id?: string;
    filename: string;
    file_size: number;
    is_clip?: boolean;
    original_content_type?: string;
}
