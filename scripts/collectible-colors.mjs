// One-off: derives shop filter data (colours from the preview art, themes from names) for assets/collectibles.json.
// Usage: node scripts/collectible-colors.mjs   -> writes assets/collectible-colors.json
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ASSETS = path.resolve(process.argv[2] ?? "assets");
const catalog = JSON.parse(fs.readFileSync(path.join(ASSETS, "collectibles.json"), "utf8"));
const CDN = "https://cdn.discordapp.com";

const products = catalog.flatMap((category) => category.products.map((product) => ({ product, category })));

// the best still image for a product, per item type
const imageUrl = ({ product }) => {
    const item = product.items?.[0];
    if (product.type === 1000) return product.preview_assets?.fg_static;
    if (product.type === 0 && item?.asset) return `${CDN}/avatar-decoration-presets/${item.asset}.png`;
    if (product.type === 2 && item?.asset) return `${CDN}/assets/collectibles/${item.asset}static.png`;
    if (product.type === 1 && item?.thumbnailPreviewSrc) return item.thumbnailPreviewSrc;
    return undefined;
};

const hsv = (r, g, b) => {
    const max = Math.max(r, g, b),
        min = Math.min(r, g, b),
        d = max - min;
    let h = 0;
    if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [(h * 60 + 360) % 360, max ? d / max : 0, max / 255];
};

const hueName = (h, v) => {
    if (h < 12 || h >= 345) return "RED";
    if (h < 40) return v < 0.6 ? "BROWN" : "ORANGE";
    if (h < 70) return "YELLOW";
    if (h < 185) return "GREEN";
    if (h < 255) return "BLUE";
    if (h < 300) return "PURPLE";
    return "PINK";
};

const colorsOf = async (buffer) => {
    const { data, info } = await sharp(buffer, { animated: false }).resize(48, 48, { fit: "inside" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const weights = {};
    let opaque = 0,
        colored = 0,
        bright = 0,
        dark = 0;
    for (let i = 0; i < data.length; i += info.channels) {
        if (data[i + 3] < 128) continue;
        opaque++;
        const [h, s, v] = hsv(data[i], data[i + 1], data[i + 2]);
        if (v < 0.18) {
            dark++;
            continue;
        }
        if (s < 0.2) {
            if (v > 0.8) bright++;
            continue;
        }
        const w = s * v;
        const name = hueName(h, v);
        weights[name] = (weights[name] ?? 0) + w;
        colored += w;
    }
    if (!opaque) return [];
    if (colored / opaque < 0.08) return [bright >= dark ? "WHITE" : "BLACK"];
    const ranked = Object.entries(weights).sort((a, b) => b[1] - a[1]);
    const out = [ranked[0][0]];
    for (const [name, weight] of ranked.slice(1, 3)) if (weight >= ranked[0][1] * 0.5) out.push(name);
    if (bright / opaque > 0.35 && !out.includes("WHITE")) out.push("WHITE");
    return out;
};

const fetchImage = async (url) => {
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
            if (res.ok) return Buffer.from(await res.arrayBuffer());
            if (res.status === 404) return null;
        } catch {}
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
    return null;
};

// themes come from names only, so they are a rough guess
const THEMES = {
    ANIME: ["anime", "manga", "chibi", "sailor", "shonen", "waifu"],
    GAMING: [
        "game",
        "gaming",
        "arcade",
        "pixel",
        "joystick",
        "controller",
        "esport",
        "valorant",
        "minecraft",
        "fortnite",
        "headset",
        "8-bit",
        "retro",
        "league of",
        "pac-man",
        "player",
    ],
    CUTE_COZY: ["cute", "cozy", "kawaii", "bunny", "kitten", "plush", "pastel", "sweet", "cottage", "snug", "blanket", "kitty", "fluffy", "heart", "bear"],
    SCI_FI: [
        "cyber",
        "space",
        "alien",
        "sci-fi",
        "galaxy",
        "robot",
        "futur",
        "astronaut",
        "planet",
        "cosmic",
        "hologram",
        "mech",
        "android",
        "ufo",
        "neon",
        "glitch",
        "orbit",
        "nova",
    ],
    FOOD_DRINKS: [
        "pizza",
        "burger",
        "coffee",
        "tea",
        "boba",
        "cake",
        "donut",
        "doughnut",
        "sushi",
        "taco",
        "food",
        "ramen",
        "cookie",
        "drink",
        "fries",
        "candy",
        "ice cream",
        "bread",
        "cheese",
        "fruit",
        "pumpkin spice",
        "soda",
    ],
    FANTASY: [
        "dragon",
        "wizard",
        "witch",
        "magic",
        "fairy",
        "elf",
        "sword",
        "knight",
        "myth",
        "mystic",
        "enchant",
        "crystal",
        "unicorn",
        "castle",
        "spell",
        "potion",
        "cauldron",
        "sorcer",
        "phoenix",
        "fantasy",
        "kingdom",
    ],
    ANIMALS_PETS: [
        "cat",
        "dog",
        "fox",
        "bunny",
        "bird",
        "pet",
        "animal",
        "wolf",
        "bear",
        "panda",
        "frog",
        "turtle",
        "axolotl",
        "kitten",
        "puppy",
        "owl",
        "shark",
        "duck",
        "crow",
        "raven",
        "bee",
        "fish",
        "paw",
        "whale",
        "deer",
    ],
    NATURE: [
        "flower",
        "leaf",
        "leaves",
        "forest",
        "tree",
        "ocean",
        "wave",
        "sakura",
        "mountain",
        "sun",
        "cloud",
        "rain",
        "garden",
        "mushroom",
        "floral",
        "vine",
        "blossom",
        "water",
        "aurora",
        "nature",
        "moss",
        "meadow",
        "petal",
        "bloom",
    ],
    MOVIES_TV_SHOWS: ["movie", "film", "cinema", "tv show", "series", "popcorn", "arcane", "hollywood", "episode", "season", "netflix", "studio"],
    DARK_MOODY: [
        "dark",
        "gothic",
        "goth",
        "skull",
        "shadow",
        "vampire",
        "haunt",
        "ghost",
        "spooky",
        "night",
        "demon",
        "grim",
        "reaper",
        "midnight",
        "eerie",
        "creepy",
        "phantom",
        "wraith",
        "curse",
        "abyss",
        "void",
        "blood",
        "horror",
        "doom",
    ],
};
const themeRegexes = Object.entries(THEMES).map(([name, words]) => [name, new RegExp(`\\b(?:${words.map((w) => w.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")).join("|")})`, "i")]);
const themesOf = ({ product, category }) => {
    const text = [product.name, category.name, ...(product.items ?? []).map((item) => item.label)].filter(Boolean).join(" ");
    return themeRegexes.filter(([, re]) => re.test(text)).map(([name]) => name);
};

const result = {};
let done = 0,
    failed = 0;
const queue = [...products];
const worker = async () => {
    for (let entry; (entry = queue.shift()); ) {
        const sku = entry.product.sku_id;
        if (result[sku]) continue;
        const url = imageUrl(entry);
        let colors = [];
        if (url) {
            const buffer = await fetchImage(url);
            if (buffer) colors = await colorsOf(buffer).catch(() => []);
            else failed++;
        }
        result[sku] = { c: colors, t: themesOf(entry) };
        if (++done % 100 === 0) console.log(`${done}/${products.length} (${failed} images failed)`);
    }
};
await Promise.all(Array.from({ length: 8 }, worker));

// products without art (frames) take the colours of a bundle that contains them
const bundles = products.filter(({ product }) => product.type === 1000);
for (const { product } of products) {
    if (result[product.sku_id].c.length) continue;
    const bundle = bundles.find(({ product: b }) => b.bundled_products?.some((x) => x.sku_id === product.sku_id) && result[b.sku_id]?.c.length);
    if (bundle) result[product.sku_id].c = result[bundle.product.sku_id].c;
}

for (const sku of Object.keys(result)) {
    result[sku].c = result[sku].c.map((x) => `COLLECTIBLES_COLOR_${x}`);
    result[sku].t = result[sku].t.map((x) => `COLLECTIBLES_THEME_${x}`);
}
fs.writeFileSync(path.join(ASSETS, "collectible-colors.json"), JSON.stringify(result));
const tally = {};
for (const { c } of Object.values(result)) for (const x of c) tally[x] = (tally[x] ?? 0) + 1;
console.log(`wrote ${Object.keys(result).length} products, ${failed} images failed`, tally);
