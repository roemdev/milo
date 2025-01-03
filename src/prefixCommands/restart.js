const { EmbedBuilder } = require("discord.js");
const assets = require('../../assets.json');

module.exports = {
  name: "reset",
  description: "Reinicia el bot.",
  async execute(message, args) {
    
    const ownerId = "271683421065969664"
    const embed = new EmbedBuilder();

    if (message.author.id !== ownerId) {
      embed
        .setColor(assets.color.red)
        .setDescription(`${assets.emoji.deny} <@${message.author.id}> No tienes permiso para realizar esta acción.`);
        
      await message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });

    } else {
      embed
        .setColor(assets.color.green)
        .setDescription(`${assets.emoji.check} <@${message.author.id}> El bot se está reiniciando.`);
      
      await message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });

      process.exit(0);
    }
  },
};
