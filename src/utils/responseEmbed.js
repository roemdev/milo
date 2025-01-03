const { EmbedBuilder } = require("discord.js");

async function responseEmbed(type, description, messageOrInteraction) {
  let color, icon, userId;

  // Determina el usuario basándose en si es una interacción o un mensaje normal
  if (messageOrInteraction.user) {
    userId = messageOrInteraction.user.id;
  } else if (messageOrInteraction.author) {
    userId = messageOrInteraction.author.id;
  } else {
    throw new Error("messageOrInteraction debe ser una interacción o un mensaje.");
  }

  // Determina el color y el icono según el tipo de respuesta
  if (type === "warn") {
    color = "#FFC868";
    icon = `<:advise:1313237521634689107>`;
  } else if (type === "agree") {
    color = "#79E096";
    icon = `<:check:1313237490395648021>`;
  } else if (type === "info") {
    color = 'NotQuiteBlack';
    icon = ``;
  }else {
    throw new Error("Tipo de respuesta no válido. Usa 'warn', 'agree' o 'info'.");
  }

  // Crea el embed
  const embed = new EmbedBuilder()
    .setColor(color)
    .setDescription(`${icon} <@${userId}>: ${description}`);

  try {
    if (messageOrInteraction.replied || messageOrInteraction.deferred) {
      // Si ya se ha respondido o diferido, editamos la respuesta
      await messageOrInteraction.editReply({
        embeds: [embed],
        allowedMentions: { repliedUser: false },
      });
    } else {
      // Si no se ha respondido o diferido, respondemos con un nuevo embed
      await messageOrInteraction.reply({
        embeds: [embed],
        ephemeral: messageOrInteraction.user ? true : false,
        allowedMentions: { repliedUser: false },
      });
    }
  } catch (error) {
    console.error("Error al intentar responder con el embed:", error);
  }
}

module.exports = { responseEmbed };
