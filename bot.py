import os
import discord
import aiohttp
from discord.ext import commands
from dotenv import load_dotenv

load_dotenv()
TOKEN = os.getenv("DISCORD_TOKEN")

intents = discord.Intents.default()
intents.message_content = True
intents.members = True

bot = commands.Bot(command_prefix="!", intents=intents)

# gdbrowser.com now answers scripts with a Cloudflare challenge, so ask the
# game's own server, which refuses any request carrying a User-Agent.
GD_LEVELS_URL = "https://www.boomlings.com/database/getGJLevels21.php"
GD_SECRET = "Wmfd2893gb7"

# Indexed by the level's official song (key 12) plus one, as GDBrowser's misc/music.json.
OFFICIAL_SONGS = [
    "Stay Inside Me", "Stereo Madness", "Back on Track", "Polargeist",
    "Dry Out", "Base After Base", "Can't Let Go", "Jumper",
    "Time Machine", "Cycles", "xStep", "Clutterfunk",
    "Theory of Everything", "Electroman Adventures", "Clubstep", "Electrodynamix",
    "Hexagon Force", "Blast Processing", "Theory of Everything 2", "Geometrical Dominator",
    "Deadlocked", "Fingerdash", "The Seven Seas", "Viking Arena",
    "Airborne Robots", "The Challenge", "Payload", "Beast Mode",
    "Machina", "Years", "Frontlines", "Space Pirates",
    "Striker", "Embers", "Round 1", "Monster Dance Off",
    "Press Start", "Nock Em", "Power Trip",
]

# Difficulty names by key 9, and demon types by key 43, as GDBrowser's classes/Level.js.
DIFFICULTIES = {"10": "Easy", "20": "Normal", "30": "Hard", "40": "Harder", "50": "Insane"}
DEMON_TYPES = {"3": "Easy", "4": "Medium", "5": "Insane", "6": "Extreme"}

def split_pairs(text, sep):
    parts = text.split(sep)
    return dict(zip(parts[::2], parts[1::2]))

# The answer is "<level>#<creators>#<songs>#<page>#<hash>", or "-1" when no level matches.
def parse_level(text):
    level_part, creators_part, songs_part = text.split("#")[:3]
    level = split_pairs(level_part, ":")

    creator = "Unknown"
    for entry in creators_part.split("|"):
        player_id, name, *_ = entry.split(":") + [""]
        if player_id == level.get("6"):
            creator = name

    custom_song = level.get("35", "0")
    if custom_song != "0":
        song_name, song_id = "Unknown", custom_song
        for entry in songs_part.split("~:~"):
            song = split_pairs(entry, "~|~")
            if song.get("1") == custom_song:
                song_name = song.get("2", "Unknown")
    else:
        official = int(level.get("12", "0")) + 1
        song_name = OFFICIAL_SONGS[official] if official < len(OFFICIAL_SONGS) else "Unknown"
        song_id = f"Level {official}"

    # None for an unrated level
    difficulty = DIFFICULTIES.get(level.get("9"))
    if level.get("17") == "1":
        difficulty = DEMON_TYPES.get(level.get("43"), "Hard") + " Demon"
    if level.get("25") == "1":
        difficulty = "Auto"

    return {
        "difficulty": difficulty,
        "name": level.get("2", "Unknown"),
        "author": creator,
        "id": level.get("1", "Unknown"),
        "songName": song_name,
        "songID": song_id,
    }

@bot.event
async def on_ready():
    print(f"Logged in as {bot.user}!")

@bot.command()
async def gdinfo(ctx, level_id: str):
    # The server reads a non-numeric str as a name search, so only IDs go through.
    if not level_id.isdigit():
        await ctx.send("Error fetching level information. Make sure the ID is correct.")
        return

    async with aiohttp.ClientSession(skip_auto_headers=["User-Agent"]) as session:
        try:
            data = {"secret": GD_SECRET, "type": "0", "str": level_id}
            async with session.post(GD_LEVELS_URL, data=data) as resp:
                text = await resp.text()
                if resp.status != 200 or text.startswith("-1"):
                    await ctx.send("Error fetching level information. Make sure the ID is correct.")
                    return

                level = parse_level(text)

                level_name = level['name']
                creator = level['author']
                level_id = level['id']
                song_name = level['songName']
                song_id = level['songID']
                difficulty = f" ({level['difficulty']})" if level['difficulty'] else ""

                msg = (
                    f"**{level_name}{difficulty}** By **{creator}** - 100% | MrSpaghetti\n\n"
                    f"**Level name:** {level_name}\n"
                    f"**Publisher:** {creator}\n"
                    f"**ID:** {level_id}\n"
                    f"**Song:** {song_name} (ID: {song_id})\n\n"
                    f"#geometrydash\n"
                    f"#mrspaghetti"
                )

                await ctx.send(msg)

        except Exception as e:
            await ctx.send("An error occurred.")
            print(f"Error: {e}")

bot.run(TOKEN)
