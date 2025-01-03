const { Events, ActivityType } = require("discord.js");

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`Bot ready! Logged in as ${client.user.tag}`); 
  }
};
/***
 * client.user.setPresence({ activities: [
 * { name: 'Todos somos Arkania',
 * type: ActivityType.Custom }],
 * status: "online", });
***/
