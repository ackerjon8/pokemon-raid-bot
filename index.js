require('dotenv').config();
const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder,
    Partials
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// ================================
// 🔧 CONFIG (YOUR IDs)
// ================================

const RAID_NOTIFICATION_CHANNEL_ID = "1478302015577919510";
const RULES_MESSAGE_ID = "1478306983957233754";
const VERIFICATION_CHANNEL_ID = "1478475843595538672";

const POGO_ROLE_ID = "1478302012675461188";
const MYSTIC_ROLE_ID = "1478302012675461184";
const VALOR_ROLE_ID = "1478302012675461185";
const INSTINCT_ROLE_ID = "1478302012675461183";

// ================================
// 🚪 AUTO KICK AFTER 24 HOURS
// ================================

client.on('guildMemberAdd', member => {

    setTimeout(async () => {
        const refreshed = await member.guild.members.fetch(member.id).catch(() => null);
        if (!refreshed) return;

        if (!refreshed.roles.cache.has(POGO_ROLE_ID)) {
            refreshed.kick("Did not verify within 24 hours").catch(() => {});
        }
    }, 24 * 60 * 60 * 1000);

});

// ================================
// 📜 RULES REACTION (✅ ONLY)
// ================================

client.on('messageReactionAdd', async (reaction, user) => {

    if (user.bot) return;

    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch {
            return;
        }
    }

    if (reaction.message.id !== RULES_MESSAGE_ID) return;

    if (reaction.emoji.name !== "✅") {
        reaction.users.remove(user.id).catch(() => {});
        return;
    }

    const member = await reaction.message.guild.members.fetch(user.id);

    if (!member.roles.cache.has(POGO_ROLE_ID)) {
        await member.roles.add(POGO_ROLE_ID);
    }

    reaction.users.remove(user.id).catch(() => {});
});

// ================================
// 🏆 TEAM VERIFICATION
// ================================

client.on('messageCreate', async message => {

    if (message.author.bot) return;
    if (message.channel.id !== VERIFICATION_CHANNEL_ID) return;
    if (!message.content.startsWith("!team")) return;

    const args = message.content.split(" ");
    const teamChoice = args[1]?.toLowerCase();
    const member = message.member;

    if (!member.roles.cache.has(POGO_ROLE_ID)) {
        return message.reply("You must verify in #rules first.");
    }

    const teamRoles = [MYSTIC_ROLE_ID, VALOR_ROLE_ID, INSTINCT_ROLE_ID];

    for (const roleId of teamRoles) {
        if (member.roles.cache.has(roleId)) {
            return message.reply("You already selected a team.");
        }
    }

    let roleToGive;
    let teamName;

    if (teamChoice === "mystic") {
        roleToGive = MYSTIC_ROLE_ID;
        teamName = "Team Mystic 🔵";
    } 
    else if (teamChoice === "valor") {
        roleToGive = VALOR_ROLE_ID;
        teamName = "Team Valor 🔴";
    } 
    else if (teamChoice === "instinct") {
        roleToGive = INSTINCT_ROLE_ID;
        teamName = "Team Instinct 🟡";
    } 
    else {
        return message.reply("Choose: `!team mystic`, `!team valor`, or `!team instinct`");
    }

    await member.roles.add(roleToGive);
    message.reply(`You have been assigned ${teamName}`);
});

// ================================
// ⚔️ RAID SYSTEM WITH IMAGE
// ================================

client.on('messageCreate', async message => {

    if (message.author.bot) return;
    if (!message.content.startsWith("!raid")) return;

    const pokemonName = message.content.slice(6).trim().toLowerCase();
    if (!pokemonName) return message.reply("Please specify a Pokémon.");

    try {

        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
        if (!response.ok) {
            return message.reply("Pokémon not found.");
        }

        const data = await response.json();

        const displayName = data.name.charAt(0).toUpperCase() + data.name.slice(1);
        const image = data.sprites.other["official-artwork"].front_default;

        const embed = new EmbedBuilder()
            .setTitle(`🔥 ${displayName} Raid 🔥`)
            .setDescription(
                `A wild **${displayName}** has appeared!\n\nReact below to join the raid!`
            )
            .setImage(image)
            .setColor(0xff0000)
            .setFooter({ text: "POGO Raid Bot" })
            .setTimestamp();

        await message.channel.send({
            content: `@everyone 🚨 ${displayName} Raid!`,
            embeds: [embed],
            allowedMentions: { parse: ['everyone'] }
        });

        const notificationChannel = client.channels.cache.get(RAID_NOTIFICATION_CHANNEL_ID);
        if (notificationChannel) {
            notificationChannel.send(
                `🔴 **${displayName.toUpperCase()}** raid reported in ${message.channel}`
            );
        }

    } catch (error) {
        console.error(error);
        message.reply("Something went wrong.");
    }
});

// ================================
// 🚀 READY
// ================================

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

// ================================
// 🔐 LOGIN
// ================================

client.login(process.env.BOT_TOKEN);
