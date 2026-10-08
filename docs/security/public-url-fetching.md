# Public URL fetching (SEC015)

The shared `fetchPublicUrl` helper validates every resolved address and pins the selected address into the HTTP/TLS connection. Redirects resolve and validate their destination independently.

The helper buffers at most 5 MiB by default, with an explicit ceiling of 32 MiB. Its 15-second deadline covers DNS, redirects and the complete response body; callers can choose at most 30 seconds. Declared and streamed byte counts are checked, interrupted responses fail, and compressed responses are rejected. Requests ask for identity encoding. Redirects are limited to three by default and five at most. Cross-origin redirects remove authorization, proxy authorization, cookies, API-key/token/signature headers, origin and referer. Request bodies also have a finite byte limit.

`security.allowPrivateNetworkRequests` remains an explicit operator override for network address restrictions. It does not remove byte, time or redirect bounds or permit URL credentials/non-HTTP schemes. The default remains false.

## Embeds and webhook avatars

Embed HTTP/HEAD requests and image probes use the shared bounded helper. Image probing consumes already-downloaded bytes through a local stream; the probe library does not independently fetch user-provided image URLs. Remote embeds and webhook avatar downloads respect `externalRequests.thirdParty`, which defaults to false. Existing cached embed records remain readable.

Local image embeds can use a narrow trust exception: the URL must match the exact configured public CDN origin, including its port, and a known numeric-ID asset locator under attachments, avatars, icons, banners, splashes, emojis or stickers. API, admin, metrics and other arbitrary paths are excluded, as are encoded path separators/NUL. Every redirect repeats this check; with external requests disabled, a redirect out of the trusted asset namespace is rejected before DNS or connection.

The helper also serves Web Push delivery, whose existing third-party and Web Push feature gates remain unchanged.

## Other outbound callers

Not every outbound request goes through this helper. ActivityHost URL mappings and application interaction endpoints use their own DNS-pinned transports with policy gates, finite byte and deadline limits and bounded admission. Activity host suffix matching and database query deadlines remain separate review targets. Operator-configured catalog/branding downloads, provider-specific GIF integrations and internal signed CDN transport are separate paths with their own trust and policy contracts.

## Testing

`bun test scripts/tests/public-fetch.test.cjs scripts/tests/remote-media.test.cjs` runs the helper against owned loopback HTTP servers, mocked DNS answers and a transport shim that checks the pinned address, without third-party requests. The cases cover rebinding, mixed and private DNS answers, private redirects, sensitive-header stripping, oversized, chunked, compressed and interrupted bodies, stalled DNS and body deadlines, aborts, bodyless HTTP 205, malformed headers and status lines, explicit private overrides, CDN namespace and origin isolation, disabled-policy redirects and stream-based image probing. They test the helper and its call-site wrappers, not live external providers.
