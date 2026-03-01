require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const PREFIX = "!";

client.on("clientReady", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === "raid") {

    if (!args.length) {
      return message.reply("❌ Please provide a Pokémon name.");
    }

    let raidType = "Standard";
    let embedColor = 0xFF0000;

    const firstArg = args[0]?.toLowerCase();

    // Mega
    if (firstArg === "mega") {
      raidType = "Mega";
      embedColor = 0x9b59b6;
      args.shift();
    }

    // Gigantamax
    else if (firstArg === "gigantamax") {
      raidType = "Gigantamax";
      embedColor = 0xf1c40f;
      args.shift();
    }

    // Dynamax
    else if (firstArg === "dynamax") {
      raidType = "Dynamax";
      embedColor = 0x3498db;
      args.shift();
    }

    const pokemonName = args.join("-").toLowerCase();

    try {
      const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
      const pokemon = res.data;

      const officialArtwork =
        pokemon.sprites.other["official-artwork"].front_default;

      const displayName = pokemon.name.toUpperCase();

      const embed = new EmbedBuilder()
        .setTitle(`🔥 ${raidType.toUpperCase()} RAID — ${displayName}`)
        .setDescription(
`🎮 **Host:** ${message.author}

⚔️ React below to join!
⏳ Raid starting soon

Good luck trainers!`
        )
        .setImage(officialArtwork)
        .setColor(embedColor)
        .setFooter({ text: "Pokémon GO Raid System" })
        .setTimestamp();

      // Smart notification
      message.channel.send({
        content: `@everyone ${raidType !== "Standard" ? raidType.toUpperCase() + " " : ""}${displayName} RAID!`,
        embeds: [embed]
      });

    } catch (err) {
      message.reply("❌ Pokémon not found!");
    }
  }
});

client.login(process.env.TOKEN);
