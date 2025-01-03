const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers)
    .setName("normas")
    .setDescription("Envía las normas de Arkania."),
  
  async execute(interaction) {
    const gifURL = 'https://cdn.discordapp.com/attachments/860528686403158046/1108384769147932682/ezgif-2-f41b6758ff.gif';

    // Embed principal de normas
    const embedNormas = new EmbedBuilder()
      .setColor("NotQuiteBlack")
      .setTitle("📋 NORMAS DEL SERVIDOR")
      .setDescription("Por favor, sigue las siguientes normas para mantener una comunidad sana y respetuosa.\n"+
        "### NO NSFW:\n> El contenido NSFW (para adultos) está estrictamente prohibido en todos los canales. \n"+
        "### NO PUBLICIDAD:\n> Está prohibida cualquier forma de publicidad de otros servidores sin autorización previa. \n"+
        "### NO SPAM:\n> Evita enviar mensajes rápidamente con la intención de interrumpir el chat.\n"+
        "### NO ACOSO:\n> No se tolerará ningún tipo de acoso, incluyendo chantajes o filtración de datos personales.\n"+
        "### NO PIRATERÍA:\n> Está prohibido compartir software pirata, cracks o contenido ilegal. \n"+
        "### DISCORD:\n> Cumple con los [Términos](https://discord.com/terms) y las [Normas](https://discord.com/guidelines) de Discord.\n"
      )
      .setImage(gifURL);

    // Embed de roles por nivel
    const embedRolesPorNivel = new EmbedBuilder()
      .setColor("NotQuiteBlack")
      .setTitle("⬆️ ROLES POR NIVEL")
      .setDescription(
        "`♦` <@&1321665235505119357>\n"+
        "`♦` <@&1234893710588645426>\n"+
        "`♦` <@&1284145958149554309>\n"+
        "`♦` <@&1247699315908935680>\n"
      )
      .setImage(gifURL);

    // Embed de beneficios de Boosters
    const embedBeneficios = new EmbedBuilder()
      .setColor("NotQuiteBlack")
      .setTitle("🎉 BENEFICIOS DE BOOSTERS / VIP")
      .setDescription(
        "`♦` Bonificación adicional al usar `$collect`.\n" +
        "`♦` Nombre separado en la lista de conectados.\n" +
        "`♦` Doble de entradas en sorteos mensuales.\n" +
        "`♦` 25% más de experiencia."
      )
      .setImage(gifURL);

    // Enviar los embeds al canal
    await interaction.channel.send({ embeds: [embedNormas, embedRolesPorNivel, embedBeneficios] });

    // Respuesta de confirmación
    await interaction.reply({
      content: "<:check:1313237490395648021> Las normas han sido enviadas al canal correctamente.",
      ephemeral: true,
    });
  },
};
