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

// ✅ NEW RAID CHANNEL ID
const RAID_NOTIFICATION_CHANNEL_ID = "1478302015577919510";

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

        // Send in command channel
        await message.channel.send({
            content: `@everyone 🚨 ${displayName} Raid!`,
            embeds: [embed],
            allowedMentions: { parse: ['everyone'] }
        });

        // Send to new 🔔 raid-notifications channel
        const notificationChannel = client.channels.cache.get(RAID_NOTIFICATION_CHANNEL_ID);

        if (notificationChannel) {
            await notificationChannel.send({
                content: `@everyone 🚨 ${displayName} Raid!`,
                embeds: [embed],
                allowedMentions: { parse: ['everyone'] }
            });
        } else {
            console.log("Raid notification channel not found.");
        }
    }
});

// ================================
// 🚀 LOGIN
// ================================
client.login(process.env.BOT_TOKEN);
