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

@bot.event
async def on_ready():
    print(f"Logged in as {bot.user}!")

@bot.command()
async def gdinfo(ctx, level_id: str):
    async with aiohttp.ClientSession() as session:
        try:
            url = f"https://gdbrowser.com/api/level/{level_id}"
            async with session.get(url) as resp:
                if resp.status != 200:
                    await ctx.send("Error fetching level information. Make sure the ID is correct.")
                    return

                level = await resp.json()

                level_name = level.get('name', 'Unknown')
                creator = level.get('author', 'Unknown')
                level_id = level.get('id', 'Unknown')
                song_name = level.get('songName', 'Unknown')
                song_id = level.get('songID', 'Unknown')

                msg = (
                    f"**{level_name} (Insane Demon)** By **{creator}** - 100% | MrSpaghetti\n\n"
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
