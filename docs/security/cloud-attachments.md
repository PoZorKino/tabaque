# Cloud attachment conversion authorization

A cloud upload reservation belongs to the authenticated uploader and the channel where it was reserved. Knowing its `uploaded_filename` is insufficient to turn it into a message attachment.

`convertCloudAttachmentToAttachment` receives a trusted actor ID from the message author or authenticated interaction request. The database lookup requires matching uploader, reservation channel and upload filename. The path must agree with the stored channel, attachment slot and filename, and the upload must have a recorded nonnegative integer size. Zero-byte completed uploads remain valid. The helper checks current `VIEW_CHANNEL` and `ATTACH_FILES` permissions again before issuing any private CDN clone request. Missing owners/channels, unfinished uploads and inconsistent object metadata are unavailable; denied channel permissions return 403. Existing own-channel copies retain their filenames, content types and attachment metadata.

`bun test scripts/tests/cloud-attachment-ownership.test.cjs` runs the production helper against a real HTTP fixture and covers a leaked foreign upload, wrong channel, absent/invalid actor, unfinished/erased ownership, mismatched object tuple and malformed paths, permission revocation, legitimate copy and an empty completed upload. The denial cases assert that no clone request reaches the fixture. The tests do not mutate existing database rows or files.

These checks cover cloud reservation conversion only. Copying posted attachments, general URL fetching, storage quotas and concurrent permission changes across a complete message transaction remain separate work.
