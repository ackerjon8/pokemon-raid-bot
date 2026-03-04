require('dotenv').config();
const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ]
});

// ================================
// 🔧 CONFIG
// ================================

const RAID_NOTIFICATION_CHANNEL_ID = "1478302015577919510";
const VERIFICATION_CHANNEL_ID = "1478475843595538672";

// ROLE IDS (ID-BASED SYSTEM)
const UNVERIFIED_ROLE_ID = "1478536945427546112";
const POGO_ROLE_ID = "1478302012675461188";
const MYSTIC_ROLE_ID = "1478302012675461184";
const VALOR_ROLE_ID = "1478302012675461185";
const INSTINCT_ROLE_ID = "1478302012675461183";

const BASE_IMAGE_URL = "https://raw.githubusercontent.com/ackerjon8/pokemon-raid-bot/main/assets/raids/";

// ================================
// 🧠 HELPERS
// ================================

function formatPokemonName(name) {
    return name.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function cleanFileName(name) {
    return name.toLowerCase().replace(/ /g, "-");
}

function getImageURL(input) {
    input = input.toLowerCase().trim();

    if (input.includes("mega")) {
        const clean = input.replace("mega ", "").replace("mega-", "").trim();
        return `${BASE_IMAGE_URL}mega-${cleanFileName(clean)}.png`;
    }

    if (input.includes("gigantamax") || input.includes("gmax")) {
        const clean = input
            .replace("gigantamax ", "")
            .replace("gmax ", "")
            .trim();
        return `${BASE_IMAGE_URL}gigantamax-${cleanFileName(clean)}.png`;
    }

    return `${BASE_IMAGE_URL}${cleanFileName(input)}.png`;
}

// ================================
// 🚪 GIVE UNVERIFIED ROLE ON JOIN
// ================================

client.on('guildMemberAdd', async member => {

    try {
        await member.roles.add(UNVERIFIED_ROLE_ID);
    } catch (err) {
        console.log("Error adding unverified role:", err);
    }

    // Auto-kick after 24 hours if still unverified
    setTimeout(async () => {
        const refreshed = await member.guild.members.fetch(member.id).catch(() => null);
        if (!refreshed) return;

        if (refreshed.roles.cache.has(UNVERIFIED_ROLE_ID)) {
            refreshed.kick("Did not verify within 24 hours").catch(() => {});
        }
    }, 24 * 60 * 60 * 1000);
});

// ================================
// 🏆 VERIFY COMMAND
// ================================

client.on('messageCreate', async message => {

    if (message.author.bot) return;
    if (message.channel.id !== VERIFICATION_CHANNEL_ID) return;
    if (!message.content.toLowerCase().startsWith("!verify")) return;

    const args = message.content.split(" ").slice(1);

    if (args.length < 2) {
        return message.reply("Usage: `!verify <IGN> <mystic|valor|instinct>`");
    }

    const ign = args[0];

    const teamInput = args
        .slice(1)
        .join(" ")
        .toLowerCase()
        .replace("team ", "")
        .trim();

    let teamRole;
    let teamName;

    if (teamInput === "mystic") {
        teamRole = MYSTIC_ROLE_ID;
        teamName = "Team Mystic 🔵";
    } 
    else if (teamInput === "valor") {
        teamRole = VALOR_ROLE_ID;
        teamName = "Team Valor 🔴";
    } 
    else if (teamInput === "instinct") {
        teamRole = INSTINCT_ROLE_ID;
        teamName = "Team Instinct 🟡";
    } 
    else {
        return message.reply("Team must be mystic, valor, or instinct.");
    }

    const member = message.member;

    try {
        await member.setNickname(ign);
    } catch {
        return message.reply("I cannot change your nickname. Move my role higher and enable Manage Nicknames.");
    }

    try {
        await member.roles.add([POGO_ROLE_ID, teamRole]);
        await member.roles.remove(UNVERIFIED_ROLE_ID);
    } catch (err) {
        console.log("Role error:", err);
        return message.reply("I cannot assign roles. Check role hierarchy.");
    }

    message.reply(`✅ Verification complete! Welcome ${ign} of ${teamName}!`);
});

// ================================
// ⚔️ RAID SYSTEM
// ================================

client.on('messageCreate', async message => {

    if (message.author.bot) return;
    if (!message.content.startsWith("!raid")) return;

    const args = message.content.slice(6).trim();
    if (!args) return message.reply("Please specify a Pokémon.");

    const displayName = formatPokemonName(args);
    const imageURL = getImageURL(args);

    const embed = new EmbedBuilder()
        .setTitle(`🔥 ${displayName} Raid 🔥`)
        .setDescription(
            `A wild **${displayName}** has appeared!\n\nReact below to join the raid!`
        )
        .setImage(imageURL)
        .setColor(0xff0000)
        .setTimestamp();

    await message.channel.send({
        content: `@everyone 🚨 ${displayName} Raid!`,
        embeds: [embed],
        allowedMentions: { parse: ['everyone'] }
    });

    const notificationChannel = client.channels.cache.get(RAID_NOTIFICATION_CHANNEL_ID);
    if (notificationChannel) {
        notificationChannel.send(
            `🔥 ${displayName.toUpperCase()} raid reported in ${message.channel}`
        );
    }
});

// ================================
// 🚀 READY
// ================================

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.login(process.env.BOT_TOKEN);
