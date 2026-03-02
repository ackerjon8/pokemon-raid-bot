const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');

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
// 🧠 Helper: Format Pokemon Name
// ================================
function formatPokemonName(name) {
    return name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// ================================
// 🖼️ Helper: Get Custom Image URL
// ================================
async function getImageUrl(pokemonName) {
    const formatted = pokemonName.toLowerCase().replace(/ /g, "-");
    const customImage = `${IMAGE_BASE_URL}${formatted}.png`;

    try {
        const response = await fetch(customImage, { method: "HEAD" });
        if (response.ok) {
            return customImage;
        }
    } catch (err) {
        console.log("Custom image not found, using fallback.");
    }

    // Fallback to PokéAPI
    const apiName = formatted
        .replace("mega-", "mega-")
        .replace("dynamax-", "");

    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${apiName}`);
    const data = await response.json();
    return data.sprites.other["official-artwork"].front_default;
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
            .setImage(imageUrl)
            .setFooter({ text: "Raid Bot | Powered by ackerjon8" })
            .setTimestamp();

        await message.channel.send({
            content: `@everyone 🚨 ${displayName} Raid!`,
            embeds: [embed],
            allowedMentions: { parse: ['everyone'] }
        });
    }
});

client.login("YOUR_BOT_TOKEN_HERE");
