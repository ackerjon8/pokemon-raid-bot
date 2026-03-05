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

const RAID_NOTIFICATION_CHANNEL = "1478302015577919510";
const RULES_CHANNEL = "1478302013971238985";
const VERIFICATION_CHANNEL = "1478475843595538672";
const RULE_MESSAGE_ID = "1478306983957233754";

const ROLE_UNVERIFIED = "1478536945427546112";
const ROLE_TRAINER = "1478302012675461188";
const TEAM_MYSTIC = "1478302012675461184";
const TEAM_VALOR = "1478302012675461185";
const TEAM_INSTINCT = "1478302012675461183";

const GITHUB_RAIDS =
"https://raw.githubusercontent.com/ackerjon8/pokemon-raid-bot/main/assets/raids/";

client.once("ready", () => {
console.log(`✅ Logged in as ${client.user.tag}`);
});

async function getPokemonImage(name) {

let formatted = name.toLowerCase().replace(/ /g,"-");

const githubImage = `${GITHUB_RAIDS}${formatted}.png`;

try {
await axios.get(githubImage);
return githubImage;
} catch {}

try {

const apiName = formatted
.replace("mega-","")
.replace("gigantamax-","")
.replace("gmax-","");

const data = await axios.get(
`https://pokeapi.co/api/v2/pokemon/${apiName}`
);

return data.data.sprites.other["official-artwork"].front_default;

} catch {

return null;

}

}

client.on("messageCreate", async (message) => {

if(message.author.bot) return;
if(!message.content.startsWith(PREFIX)) return;

const args = message.content.slice(PREFIX.length).trim().split(/ +/);
const command = args.shift().toLowerCase();

if(command === "raid"){

if(!args.length){
return message.reply("Usage: `!raid pokemon`");
}

const pokemon = args.join(" ");
const image = await getPokemonImage(pokemon);

const embed = new EmbedBuilder()
.setTitle(`🔥 ${pokemon} Raid 🔥`)
.setDescription(
`A wild **${pokemon}** has appeared!\n\nReact below to join the raid!`
)
.setColor("Orange")
.setTimestamp();

if(image) embed.setImage(image);

await message.channel.send({
content:`@everyone 🚨 **${pokemon} Raid!**`,
embeds:[embed]
});

const bellChannel = message.guild.channels.cache.get(RAID_NOTIFICATION_CHANNEL);

if(bellChannel){

await bellChannel.send({
content:`@everyone 🚨 **${pokemon} Raid!**`,
embeds:[embed]
});

}

}

if(command === "verify"){

if(message.channel.id !== VERIFICATION_CHANNEL){
return message.reply("Use this command in verification channel.");
}

const ign = args[0];
const team = args[1]?.toLowerCase();

if(!ign || !team){
return message.reply(
"Usage: `!verify IGN team`\nExample: `!verify Null mystic`"
);
}

const member = message.member;

if(!member.roles.cache.has(ROLE_TRAINER)){
return message.reply(
"You must react to the rules message first."
);
}

let teamRole;

if(team === "mystic") teamRole = TEAM_MYSTIC;
if(team === "valor") teamRole = TEAM_VALOR;
if(team === "instinct") teamRole = TEAM_INSTINCT;

if(!teamRole){
return message.reply("Team must be: mystic, valor, or instinct");
}

if(
member.roles.cache.has(TEAM_MYSTIC) ||
member.roles.cache.has(TEAM_VALOR) ||
member.roles.cache.has(TEAM_INSTINCT)
){
return message.reply("You already picked a team.");
}

await member.roles.add(teamRole);
await member.roles.remove(ROLE_UNVERIFIED);

try{
await member.setNickname(ign);
}catch{}

return message.reply(
`✅ Verified!\nIGN set to **${ign}**\nTeam role assigned.`
);

}

});

client.on("messageReactionAdd", async (reaction,user)=>{

if(user.bot) return;

if(reaction.message.id !== RULE_MESSAGE_ID) return;

const guild = reaction.message.guild;
const member = await guild.members.fetch(user.id);

if(!member.roles.cache.has(ROLE_TRAINER)){

await member.roles.add(ROLE_TRAINER);

}

reaction.users.remove(user.id);

});

client.on("guildMemberAdd", async member => {

await member.roles.add(ROLE_UNVERIFIED);

setTimeout(async () => {

if(member.roles.cache.has(ROLE_UNVERIFIED)){

member.kick("Did not verify within 24 hours");

}

}, 86400000);

});

client.login(process.env.TOKEN);
