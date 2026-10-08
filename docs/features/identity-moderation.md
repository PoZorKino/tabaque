# Identity name moderation

The instance rejects a local list of explicit hate slurs in new usernames, display names and guild nicknames. Registration, user renames, bot creation and renames, administrator identity edits and both guild nickname routes enforce the same rule before writing the name. It does not rename existing accounts or inspect private messages.

Operators edit blocked identity words in the admin dashboard Settings. The Settings API uses `user.identityBlockedTerms`. The list accepts up to 256 words of up to 64 letters or numbers. Saving replaces the list rather than retaining removed entries. The default list does not block queer, trans, lesbian, gay or pride identity labels.

Matching uses NFKC, lowercase, removal of Unicode formatting characters and common numeral substitutions. Punctuation and spaces between letters are accepted as obfuscation. Unicode letter boundaries preserve innocent substrings such as Scunthorpe, Pakistan and spice. Arbitrary spellings, homoglyphs and other languages need additional operator terms. This is a basic name filter, not a complete abuse detection system.

## Testing

`bun test scripts/tests/identity-moderation.test.cjs` covers the matcher, field errors, operator terms and configuration reload and serialization, including empty and reduced lists.
