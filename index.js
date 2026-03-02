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

// ================================
// 🔧 CONFIG
// ================================
const GITHUB_USER = "ackerjon8";
const GITHUB_REPO = "pokemon-raid-bot";
const GITHUB_BRANCH = "main";
const IMAGE_BASE_URL = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/assets/raids/`;

// ================================
// 🧠 Format Pokemon Name
// ================================
function formatPokemonName(name) {
    return name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// ================================
// 🖼️ Get Image (Custom → Fallback)
// ================================
async function getImageUrl(pokemonName) {
    const formatted = pokemonName.toLowerCase().replace(/ /g, "-");
    const customImage = `${IMAGE_BASE_URL}${formatted}.png`;

    try {
        await axios.head(customImage);
        return customImage;
    } catch {
        console.log("Custom image not found. Using PokéAPI fallback.");
    }

    // Remove dynamax prefix for API
    const apiName = formatted.replace("dynamax-", "");

    try {
        const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${apiName}`);
        return response.data.sprites.other["official-artwork"].front_default;
    } catch (error) {
        console.error("PokéAPI failed:", error.message);
        return null;
    }
}

// ================================
// ⚔️ RAID COMMAND
// ================================
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content.startsWith("!raid")) {

        const args = message.content.slice(6).trim().toLowerCase().split(" ");
        const pokemonInput = args.join(" ");
        const displayName = formatPokemonName(pokemonInput);

        if (!pokemonInput) {
            return message.reply("Please specify a Pokémon.");
        }

        const imageUrl = await getImageUrl(pokemonInput);

        const embed = new EmbedBuilder()
            .setTitle(`🔥 ${displayName} Raid 🔥`)
            .setDescription(`A wild **${displayName}** has appeared!\n\nReact below to join the raid!`)
            .setColor(0xff0000)
            .setFooter({ text: "Raid Bot | ackerjon8" })
            .setTimestamp();

        if (imageUrl) {
            embed.setImage(imageUrl);
        }

        await message.channel.send({
            content: `@everyone 🚨 ${displayName} Raid!`,
            embeds: [embed],
            allowedMentions: { parse: ['everyone'] }
        });
    }
});

// ================================
// 🚀 LOGIN
// ================================
client.login(process.env.BOT_TOKEN);
