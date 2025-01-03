const { Events } = require("discord.js");

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.channel.id === "1324197341447848046") {
      if (!message.author.bot) {
        try {
          await message.react("👋");
        } catch (error) {
          console.error(`No se pudo reaccionar al mensaje: ${error}`);
        }
      }
    }
  },
};
