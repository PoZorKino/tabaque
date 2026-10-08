# Pride badge artwork

The picker offers 85 flags. 39 come from [b3yc0d3/twemoji-flags](https://github.com/b3yc0d3/twemoji-flags), pinned to commit `1eee036f2567edc1f56f7dcb4105eae5a347cc7b`, and 46 are supplemental flags drawn locally. All 85 are local SVGs, so selecting or displaying a badge makes no external artwork or API request.

**Do not include heterosexual or cisgender flags.**

The authoritative snapshot is `assets/badge-icons/twemoji-flags/manifest.json`. It records each upstream filename, local slug and icon mapping, SHA-256 checksum, the commit and the graphics license, and lists the supplemental flags with their checksums. The source directory holds the 39 upstream flag SVGs and `TEMPLATE_FLAG.svg`. The template is an authoring file that the upstream build excludes from selectable flags, and so does this instance. The upstream heterosexual flag is left out on purpose. The original SVGs, template, README and both upstream licenses are vendored next to the manifest. Graphics are licensed under CC BY 4.0, the upstream software license is MPL 2.0, and no upstream build code is used here.

The upstream flag images are copied without modifications. Every flag upstream lacks is drawn locally. The supplemental images use the exact upstream template silhouette, a rounded flag in a 36 by 26 area on a 36 by 36 canvas, with locally drawn stripes and symbols. Each stripe runs to the bottom edge under the next one, so no hairline seams show between stripes. The intersex-inclusive Progress circle stays circular and inside the yellow chevron. Attribution appears in the picker and in [the vendored attribution file](../../assets/badge-icons/twemoji-flags/ATTRIBUTION.md).

Badge IDs run from `8000000000000000001` to `8000000000000000086`. `8000000000000000043` belonged to the removed heterosexual flag and is never reused. New flags take the next ID and go to the end of `src/api/util/utility/prideBadges.ts`, and slugs and IDs never change once shipped. Stored unknown selections are returned unchanged to their owner, and saving an unknown slug fails validation instead of dropping it silently.

## Supplemental flags

The first 10 supplemental flags keep selections that predate the upstream snapshot: rainbow, original eight-stripe rainbow, Philadelphia, intersex-inclusive Progress, seven-stripe lesbian, five-stripe gay men, gray-asexual, grayromantic, unlabeled and androgyne. Their palettes follow [Gilbert Baker's rainbow history](https://gilbertbaker.com/rainbow-flag-origin-story/), [Valentino Vecchietti's intersex-inclusive Progress flag](https://www.intersexequality.com/intersex-inclusive-progress-pride-flag/), [AUREA's aromantic resources](https://www.aromanticism.org/en/resources-1), [AVEN's asexual flag reference](https://wiki.asexuality.org/w/index.php?title=Asexual_flag) and [Microsoft's community pride flag references](https://github.com/microsoft/Pride). The five- and seven-stripe lesbian and gay men variants stay distinct. Bisexual stripes are 40:20:40 in the upstream art, and androgyne has vertical stripes.

The other 36 follow the lead flag on each term's [LGBTQIA+ Wiki](https://lgbtqia.wiki) page. Stripe colors were sampled from that image and the shapes were redrawn by hand, so no wiki artwork is vendored or traced. The romantic flags built on a sexuality flag reuse the upstream colors of that flag. Their stripes are faded to half strength and a full-color heart covers the middle.

| Flag               | Design                                                                      | Reference                                                  |
| ------------------ | --------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Abroromantic       | Abrosexual stripes with a heart                                             | [Abroromantic](https://lgbtqia.wiki/wiki/Abroromantic)     |
| Aceflux            | Five stripes from red to purple                                             | [Aceflux](https://lgbtqia.wiki/wiki/Aceflux)               |
| Ambiamorous        | Seven stripes in 2:1:1:2:1:1:2 from blue through black to red, white alpha  | [Ambiamorous](https://lgbtqia.wiki/wiki/Ambiamorous)       |
| Androromantic      | Androsexual stripes with a heart                                            | [Androromantic](https://lgbtqia.wiki/wiki/Androromantic)   |
| Aporagender        | Pink, lavender, yellow, lavender, blue                                      | [Aporagender](https://lgbtqia.wiki/wiki/Aporagender)       |
| Aroflux            | Five stripes from red to green                                              | [Aroflux](https://lgbtqia.wiki/wiki/Aroflux)               |
| Bigender           | Pink, yellow, white, purple, blue, by fireprincette                         | [Bigender](https://lgbtqia.wiki/wiki/Bigender)             |
| Biromantic         | Bisexual stripes with a gray heart in the top left                          | [Biromantic](https://lgbtqia.wiki/wiki/Biromantic)         |
| Ceteroromantic     | Yellow, green, pink, white, black                                           | [Ceteroromantic](https://lgbtqia.wiki/wiki/Ceteroromantic) |
| Ceterosexual       | Yellow, green, white, black                                                 | [Ceterosexual](https://lgbtqia.wiki/wiki/Ceterosexual)     |
| Demifluid          | Gray, light gray, pastel gradient, white, pastel gradient, light gray, gray | [Demifluid](https://lgbtqia.wiki/wiki/Demifluid)           |
| Diamoric           | Green, white, green with a purple myrtle flower                             | [Diamoric](https://lgbtqia.wiki/wiki/Diamoric)             |
| Egogender          | Black, light yellow, white, gold                                            | [Egogender](https://lgbtqia.wiki/wiki/Egogender)           |
| Frayromantic       | Dark gray, gray, white, mint, teal                                          | [Frayromantic](https://lgbtqia.wiki/wiki/Frayromantic)     |
| Gender neutral     | Yellow, white, light green, green, by enbygsrd                              | [Neutral](https://lgbtqia.wiki/wiki/Neutral)               |
| Gender questioning | Nine pink, gray and blue stripes, by enbygsrd                               | [Questioning](https://lgbtqia.wiki/wiki/Questioning)       |
| Graygender         | Gray, white, navy, white, dark gray with thin white stripes                 | [Greygender](https://lgbtqia.wiki/wiki/Greygender)         |
| Gyneromantic       | Gynesexual stripes with a heart                                             | [Gyneromantic](https://lgbtqia.wiki/wiki/Gyneromantic)     |
| Hijra              | Pink, white, red, white, blue                                               | [Hijra](https://lgbtqia.wiki/wiki/Hijra)                   |
| Intergender        | Purple, yellow, purple with a white ring                                    | [Intergender](https://lgbtqia.wiki/wiki/Intergender)       |
| Maverique          | Yellow, white, orange                                                       | [Maverique](https://lgbtqia.wiki/wiki/Maverique)           |
| MOGAI              | White with a color wheel ring around a grayscale ring                       | [MOGAI](https://lgbtqia.wiki/wiki/MOGAI)                   |
| Multigender        | Dark blue, light blue, orange, light blue, dark blue                        | [Multigender](https://lgbtqia.wiki/wiki/Multigender)       |
| Multisexual        | Purple, white, light blue, pink                                             | [Multisexual](https://lgbtqia.wiki/wiki/Multisexual)       |
| Neurogender        | Vertical red, lime, mint, purple with a gray infinity sign                  | [Neurogender](https://lgbtqia.wiki/wiki/Neurogender)       |
| Omniromantic       | Omnisexual stripes with a heart                                             | [Omniromantic](https://lgbtqia.wiki/wiki/Omniromantic)     |
| Pangender          | Seven pastel stripes from yellow to white and back                          | [Pangender](https://lgbtqia.wiki/wiki/Pangender)           |
| Panromantic        | Pansexual stripes with a heart                                              | [Panromantic](https://lgbtqia.wiki/wiki/Panromantic)       |
| Polygender         | Black, gray, pink, yellow, blue                                             | [Multigender](https://lgbtqia.wiki/wiki/Multigender)       |
| Polyromantic       | Polysexual stripes with a heart                                             | [Polyromantic](https://lgbtqia.wiki/wiki/Polyromantic)     |
| Pomosexual         | Seven pink, white and lavender stripes                                      | [Pomosexual](https://lgbtqia.wiki/wiki/Pomosexual)         |
| Transneutral       | Blue, three yellows, pink, by arco-pluris                                   | [Transneutral](https://lgbtqia.wiki/wiki/Transneutral)     |
| Trigender          | Pink, purple, green, purple, pink                                           | [Trigender](https://lgbtqia.wiki/wiki/Trigender)           |
| Two-spirit         | Six-stripe rainbow with two feathers under a circle                         | [Two Spirit](https://lgbtqia.wiki/wiki/Two_Spirit)         |
| Waria              | Red, black, pink, gold, brown, white                                        | [Waria](https://lgbtqia.wiki/wiki/Waria)                   |
| Xenogender         | Seven stripes from pink to purple with the white Iris symbol                | [Xenogender](https://lgbtqia.wiki/wiki/Xenogender)         |

Some terms have competing flags. Bigender uses fireprincette's flag, which the wiki calls the most common one, instead of the older seven-stripe flag whose creator is disputed. Hijra uses the Tumblr user Samir's 2018 flag. The wiki notes that hijra communities organize under the transgender and rainbow flags and that the flag's creator is not hijra. Gender questioning uses enbygsrd's flag, made for questioning gender, instead of the general questioning flag with a question mark. Two-spirit uses the feathers on the rainbow, which the wiki lists as the design with the most institutional use, including flag raisings by Lac Seul First Nation and several Canadian cities.

## Picking flags at signup

The register form has an optional "Pride flags" section under the password field. FosscordPride adds it next to the consent text and reads the catalog from `GET /api/v9/auth/pride-badges`, which needs no login, is limited to 30 requests a minute per IP and returns `max_selections` plus each flag's slug, ID, description, aliases, source and icon URL. New catalog entries show up on the form without a client change. The grid shows the first 24 flags with a "Show all" button, and search matches the description, the slug with spaces and the aliases, the same as the Profiles picker.

The plugin adds the chosen slugs to the register request as `pride_badges`, and leaves the field out when nothing is picked. The register route accepts at most as many slugs as the catalog has, the same limit as `PATCH /users/@me/pride-badges`. An unknown slug, a badge ID or a non-string fails with a `pride_badges` field error instead of being dropped, and `User.register` saves the deduplicated selection on the new account, so the flags are on the profile from the first load.

While the section is on the page, the auth card's wrapper grows with its content and the page background scrolls, instead of centering the card in a fixed-height box that cut off its top. On phones the card already scrolls itself.

## Regenerating and checking

Run `bun scripts/pride-badge-art.cjs` to reproduce the local badge images offline from the pinned originals and the template. It also rewrites the supplemental slugs and checksums in the manifest. Run `bun scripts/pride-badge-art.cjs --check` and `bun test scripts/tests/pride-badges.test.cjs scripts/tests/pride-badge-art.test.cjs scripts/tests/pride-profile-refresh.test.cjs scripts/tests/signup-pride-badges.test.cjs` to verify completeness, checksums, rendering, preserved IDs, selection validation and profile refresh coalescing. The tests take their expected counts from the manifest. The browser smoke test `scripts/dev/pride-badges-smoke.mjs` also derives its count from the manifest and checks every image, persistence, cached friend updates, clearing, search and preservation of admin-assigned badges.
