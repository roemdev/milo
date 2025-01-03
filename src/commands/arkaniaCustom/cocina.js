const { SlashCommandBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const filePath = "./json/calificaciones.json";

module.exports = {
  data: new SlashCommandBuilder()
    .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers)
    .setName("cocina")
    .setDescription("Comando para el programa de cocina")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("crear")
        .setDescription("Crear un nuevo embed de cocina")
        .addStringOption((option) =>
          option
            .setName("titulo")
            .setDescription("Título del embed")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("descripcion")
            .setDescription("Descripción del embed")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option.setName("imagen").setDescription("Imagen").setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("calificar")
        .setDescription("Habilitar calificaciones")
        .addStringOption((option) =>
          option
            .setName("mensaje_id")
            .setDescription("ID del mensaje del embed")
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    if (interaction.options.getSubcommand() === "crear") {
      const titulo = interaction.options.getString("titulo");
      const descripcion = interaction.options.getString("descripcion");
      const imagen = interaction.options.getString("imagen");

      const embed = new EmbedBuilder()
        .setColor("Orange")
        .setTitle(titulo)
        .setDescription(descripcion)
        .setImage(imagen);

      const message = await interaction.channel.send({ embeds: [embed] });

      await interaction.reply({
        content: `Embed creado: ${message.id}`,
        ephemeral: true,
      });
    } else if (interaction.options.getSubcommand() === "calificar") {
      const mensajeId = interaction.options.getString("mensaje_id");

      const message = await interaction.channel.messages.fetch(mensajeId);

      if (!message) {
        return interaction.reply({
          content: "Mensaje no encontrado",
          ephemeral: true,
        });
      }

      const calificacionesButtons = ["1", "2", "3", "4", "5"].map((num) =>
        new ButtonBuilder()
          .setCustomId(`calificacion_${num}`)
          .setLabel(`${num} ⭐`)
          .setStyle(ButtonStyle.Secondary)
      );

      const row = new ActionRowBuilder().addComponents(calificacionesButtons);

      const embed = EmbedBuilder.from(message.embeds[0]).setDescription(
        "¡Hemos terminado por hoy! ¿Qué te ha parecido?"
      );

      await message.edit({ embeds: [embed], components: [row] });

      await interaction.reply({
        content: "¡Calificaciones habilitadas!",
        ephemeral: true,
      });

      const filter = (i) => i.customId.startsWith("calificacion_");
      const collector = interaction.channel.createMessageComponentCollector({
        filter,
        time: 2 * 60 * 1000,
      });

      let calificaciones = [];
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, "utf8");
        try {
          calificaciones = JSON.parse(data);
        } catch (error) {
          console.error("Error parsing JSON:", error);
        }
      }

      collector.on("collect", async (i) => {
        const calificacion = parseInt(i.customId.split("_")[1], 10);
        const userId = i.user.id;

        const calificacionExistente = calificaciones.find(
          (c) => c.userId === userId
        );

        if (calificacionExistente) {
          calificacionExistente.calificacion = calificacion;
          fs.writeFileSync(filePath, JSON.stringify(calificaciones, null, 2));
          await i.reply({
            content: `Has cambiado tu calificación a ${calificacion}`,
            ephemeral: true,
          });
        } else {
          calificaciones.push({ userId, calificacion });
          fs.writeFileSync(filePath, JSON.stringify(calificaciones, null, 2));
          await i.reply({
            content: `Has dado una calificación de ${calificacion}`,
            ephemeral: true,
          });
        }
      });

      collector.on("end", async () => {
        if (calificaciones.length === 0) {
          return interaction.channel.send("No se recibieron calificaciones.");
        }

        const sumaCalificaciones = calificaciones.reduce(
          (acc, curr) => acc + curr.calificacion,
          0
        );
        const promedioCalificacion = (
          sumaCalificaciones / calificaciones.length
        ).toFixed(2);

        const finalEmbed = EmbedBuilder.from(message.embeds[0]).setFooter({
          text: `Calificación promedio: ${promedioCalificacion}`,
        });

        await message.edit({ embeds: [finalEmbed], components: [] });

        // Resetear calificaciones después de calcular el promedio
        calificaciones = [];
        fs.writeFileSync(filePath, JSON.stringify(calificaciones, null, 2));
      });
    }
  },
};
