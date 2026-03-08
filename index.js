require("dotenv").config();

const {
Client,
GatewayIntentBits,
Partials,
EmbedBuilder
} = require("discord.js");

const axios = require("axios");

const client = new Client({
intents: [
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent,
GatewayIntentBits.GuildMembers,
GatewayIntentBits.GuildMessageReactions
],
partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

const PREFIX = "!";

/* CHANNEL IDS */

const RAID_NOTIFICATION_CHANNEL = "1478302015577919510";
const VERIFICATION_CHANNEL = "1478475843595538672";
const RULE_MESSAGE_ID = "1478306983957233754";

/* ROLE IDS */

const ROLE_UNVERIFIED = "1478536945427546112";
const ROLE_TRAINER = "1478302012675461188";
const TEAM_MYSTIC = "1478302012675461184";
const TEAM_VALOR = "1478302012675461185";
const TEAM_INSTINCT = "1478302012675461183";

/* GITHUB IMAGE PATH */

const GITHUB_RAID_IMAGES =
"https://raw.githubusercontent.com/ackerjon8/pokemon-raid-bot/main/assets/raids/";

/* READY */

client.once("ready", () => {

console.log(`✅ Logged in as ${client.user.tag}`);

});

/* IMAGE FETCH */

async function getPokemonImage(name){

let formatted = name.toLowerCase().replace(/ /g,"-");

const githubImage = `${GITHUB_RAID_IMAGES}${formatted}.png`;

try{

await axios.get(githubImage);
return githubImage;

}catch{}

try{

const apiName = formatted
.replace("mega-","")
.replace("gigantamax-","")
.replace("dynamax-","")
.replace("gmax-","");

const res = await axios.get(
`https://pokeapi.co/api/v2/pokemon/${apiName}`
);

return res.data.sprites.other["official-artwork"].front_default;

}catch{

return null;

}

}

/* COMMAND HANDLER */

client.on("messageCreate", async (message)=>{

if(message.author.bot) return;
if(!message.content.startsWith(PREFIX)) return;

const args = message.content.slice(PREFIX.length).trim().split(/ +/);
const command = args.shift().toLowerCase();

/* RAID COMMAND */

if(command === "raid"){

if(!args.length){
return message.reply("Usage: `!raid pokemon`");
}

const pokemon = args.join(" ");

const image = await getPokemonImage(pokemon);

const embed = new EmbedBuilder()
.setTitle(`🔥 ${pokemon} Raid`)
.setDescription(`A wild **${pokemon}** has appeared!\n\nReact below to join the raid.`)
.setColor("Orange")
.setTimestamp();

if(image) embed.setImage(image);

/* RAID CHANNEL */

await message.channel.send({
content:`@everyone 🚨 **${pokemon} Raid!**`,
embeds:[embed]
});

/* NOTIFICATION CHANNEL */

const bellChannel =
message.guild.channels.cache.get(RAID_NOTIFICATION_CHANNEL);

if(bellChannel){

await bellChannel.send(
`@everyone 🚨 **${pokemon} Raid!**\nRaid location: <#${message.channel.id}>`
);

}

}

/* VERIFY COMMAND */

if(command === "verify"){

if(message.channel.id !== VERIFICATION_CHANNEL){
return message.reply("Use this command in the verification channel.");
}

if(args.length < 2){
return message.reply(
"Usage: `!verify IGN team`\nExample: `!verify Null mystic`"
);
}

const ign = args[0];
const team = args[args.length-1].toLowerCase();

let teamRole;

if(team.includes("mystic")) teamRole = TEAM_MYSTIC;
if(team.includes("valor")) teamRole = TEAM_VALOR;
if(team.includes("instinct")) teamRole = TEAM_INSTINCT;

if(!teamRole){
return message.reply(
"Team must be Mystic, Valor, or Instinct."
);
}

const member = message.member;

/* PREVENT MULTIPLE TEAM ROLES */

if(
member.roles.cache.has(TEAM_MYSTIC) ||
member.roles.cache.has(TEAM_VALOR) ||
member.roles.cache.has(TEAM_INSTINCT)
){
return message.reply("You already selected a team.");
}

/* ADD TRAINER + TEAM ROLE */

await member.roles.add([ROLE_TRAINER, teamRole]);

/* REMOVE UNVERIFIED */

await member.roles.remove(ROLE_UNVERIFIED);

/* SET IGN */

try{
await member.setNickname(ign);
}catch{}

/* SUCCESS */

return message.reply(
`✅ Verification complete!\nIGN set to **${ign}**`
);

}

});

/* RULES REACTION ROLE */

client.on("messageReactionAdd", async (reaction,user)=>{

if(user.bot) return;

if(reaction.message.id !== RULE_MESSAGE_ID) return;

const member =
await reaction.message.guild.members.fetch(user.id);

if(!member.roles.cache.has(ROLE_TRAINER)){

await member.roles.add(ROLE_TRAINER);

}

/* REMOVE REACTION */

reaction.users.remove(user.id);

});

/* MEMBER JOIN */

client.on("guildMemberAdd", async member => {

await member.roles.add(ROLE_UNVERIFIED);

/* 24H VERIFY TIMER */

setTimeout(async ()=>{

const refreshed =
await member.guild.members.fetch(member.id).catch(()=>null);

if(!refreshed) return;

if(refreshed.roles.cache.has(ROLE_UNVERIFIED)){

refreshed.kick("Did not verify within 24 hours");

}

}, 86400000);

});

/* LOGIN */

client.login(process.env.TOKEN);
