// Cloudflare Worker serving GET /level/<id> as JSON for the web page, in the shape
// gdbrowser.com used to return. gdbrowser.com now answers scripts with a Cloudflare
// challenge, and the game's own server sends no CORS headers and refuses any request
// carrying a User-Agent, so the page cannot reach either directly.
const GD_LEVELS_URL = "https://www.boomlings.com/database/getGJLevels21.php";
const GD_SECRET = "Wmfd2893gb7";

// Indexed by the level's official song (key 12) plus one, as GDBrowser's misc/music.json.
const OFFICIAL_SONGS = [
    ["Stay Inside Me", "OcularNebula"], ["Stereo Madness", "ForeverBound"], ["Back on Track", "DJVI"],
    ["Polargeist", "Step"], ["Dry Out", "DJVI"], ["Base After Base", "DJVI"],
    ["Can't Let Go", "DJVI"], ["Jumper", "Waterflame"], ["Time Machine", "Waterflame"],
    ["Cycles", "DJVI"], ["xStep", "DJVI"], ["Clutterfunk", "Waterflame"],
    ["Theory of Everything", "DJ-Nate"], ["Electroman Adventures", "Waterflame"], ["Clubstep", "DJ-Nate"],
    ["Electrodynamix", "DJ-Nate"], ["Hexagon Force", "Waterflame"], ["Blast Processing", "Waterflame"],
    ["Theory of Everything 2", "DJ-Nate"], ["Geometrical Dominator", "Waterflame"], ["Deadlocked", "F-777"],
    ["Fingerdash", "MDK"], ["The Seven Seas", "F-777"], ["Viking Arena", "F-777"],
    ["Airborne Robots", "F-777"], ["The Challenge", "RobTop"], ["Payload", "Dex Arson"],
    ["Beast Mode", "Dex Arson"], ["Machina", "Dex Arson"], ["Years", "Dex Arson"],
    ["Frontlines", "Dex Arson"], ["Space Pirates", "Waterflame"], ["Striker", "Waterflame"],
    ["Embers", "Dex Arson"], ["Round 1", "Dex Arson"], ["Monster Dance Off", "F-777"],
    ["Press Start", "MDK"], ["Nock Em", "Bossfight"], ["Power Trip", "Boom Kitty"],
];

function splitPairs(text, sep) {
    const parts = text.split(sep);
    const pairs = {};
    for (let i = 0; i + 1 < parts.length; i += 2) pairs[parts[i]] = parts[i + 1];
    return pairs;
}

// The answer is "<level>#<creators>#<songs>#<page>#<hash>".
function parseLevel(text) {
    const [levelPart, creatorsPart, songsPart] = text.split("#");
    const level = splitPairs(levelPart, ":");

    let author = "Unknown";
    for (const entry of creatorsPart.split("|")) {
        const [playerID, name] = entry.split(":");
        if (playerID === level["6"]) author = name;
    }

    let songName = "Unknown", songAuthor = "Unknown", songID;
    const customSong = level["35"] || "0";
    if (customSong !== "0") {
        songID = customSong;
        for (const entry of songsPart.split("~:~")) {
            const song = splitPairs(entry, "~|~");
            if (song["1"] === customSong) {
                songName = song["2"] || "Unknown";
                songAuthor = song["4"] || "Unknown";
            }
        }
    } else {
        const official = parseInt(level["12"] || "0") + 1;
        [songName, songAuthor] = OFFICIAL_SONGS[official] || [songName, songAuthor];
        songID = `Level ${official}`;
    }

    return { name: level["2"] || "Unknown", author, id: level["1"], songName, songAuthor, songID };
}

function json(body, status) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
}

export default {
    async fetch(request) {
        // A non-numeric str would run a name search, so only IDs go through.
        const match = new URL(request.url).pathname.match(/^\/level\/(\d+)$/);
        if (!match) return json({ error: "Level not found" }, 404);

        const resp = await fetch(GD_LEVELS_URL, {
            method: "POST",
            headers: { "User-Agent": "", "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ secret: GD_SECRET, type: "0", str: match[1] }),
        });
        const text = await resp.text();
        if (text.startsWith("-1")) return json({ error: "Level not found" }, 404);
        // Anything else not opening on key 1 is the server refusing us, a Cloudflare page.
        if (!resp.ok || !text.startsWith("1:")) return json({ error: "Geometry Dash server refused the request" }, 502);

        return json(parseLevel(text), 200);
    },
};
