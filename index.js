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

    const pokemonName = args.join("-").toLowerCase();

    try {
      const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
      const pokemon = res.data;

      const embed = new EmbedBuilder()
        .setTitle(`Pokémon: ${pokemon.name.toUpperCase()}`)
        .setDescription(
`Raid hosted by ${message.author}

📜 **Rules**
5 invites available (unless host states different)
Please message below if interested!`
        )
        .setThumbnail(pokemon.sprites.front_default)
        .setColor(0xFFA500)
        .setFooter({ text: "Pokémon GO Raid Bot" })
        .setTimestamp();

      message.channel.send({ embeds: [embed] });

    } catch (err) {
      message.reply("❌ Pokémon not found!");
    }
  }
});

client.login(process.env.TOKEN);