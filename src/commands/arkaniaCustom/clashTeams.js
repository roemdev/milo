const { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ActionRowBuilder, 
  PermissionsBitField 
} = require("discord.js");

const MAX_MEMBERS_PER_TEAM = 5;

module.exports = {
  data: new SlashCommandBuilder()
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageEvents)
    .setName("equiposclash")
    .setDescription("Configura los equipos para el Clash de LoL.")
    .addStringOption(option =>
      option
        .setName("roles")
        .setDescription("Lista de roles de equipos, separados por comas (IDs o nombres).")
        .setRequired(true)
    ),

  async execute(interaction) {
    const { options, guild, channel } = interaction;

    // Confirmación inicial
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#79E096")
          .setDescription("<:check:1313237490395648021> Equipos enviados.")
      ],
      ephemeral: true,
    });

    const rolesInput = options.getString("roles");
    const roleIdentifiers = rolesInput.split(",").map(role => role.trim());

    // Validar roles
    const roles = roleIdentifiers
      .map(id => guild.roles.cache.get(id) || guild.roles.cache.find(r => r.name === id))
      .filter(Boolean);

    if (roles.length === 0) {
      return channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor("#FFC868")
            .setDescription("<:advise:1313237521634689107> No se encontraron roles válidos. Asegúrate de ingresar IDs o nombres correctos."),
        ],
      });
    }

    // Crear botones principales
    const generateMainButtons = () => 
      new ActionRowBuilder().addComponents(
        roles.map(role => {
          const membersInRole = role.members.size;
          const availableSpots = MAX_MEMBERS_PER_TEAM - membersInRole;

          return new ButtonBuilder()
            .setCustomId(`team_${role.id}`)
            .setLabel(`${role.name} (${membersInRole}/${MAX_MEMBERS_PER_TEAM})`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(availableSpots <= 0);
        })
      );

    const embed = new EmbedBuilder()
      .setColor("NotQuiteBlack")
      .setTitle("¡Vuelve CLASH! - League of Legends")
      .setDescription("¡Fin de semana de máxima competición! Aprovecha con tiempo para coordinar con tu equipo y pelear por la victoria en esta nueva oportunidad. ¡Dejemos a Arkania en alto!")
      .addFields(
        { name: '¿Qué es el CLASH?', value: '> El Clash es un torneo dentro de League of Legends donde los equipos compiten en un formato organizado tanto el sábado como el domingo. ¡Una gran oportunidad para demostrar tus habilidades y jugar en equipo!' },
        { name: '¿Cómo funciona esto?', value: '> Elige un equipo usando los botones de abajo. Podrás ver quiénes están inscritos y decidir si unirte o salir del equipo.' }
      )
      .setImage("https://static.wikia.nocookie.net/leagueoflegends/images/d/d2/Clash_Title.png/revision/latest/scale-to-width-down/1000?cb=20190601061810")
      .setTimestamp()
      .setFooter({ text: '¿No hay más cupos? Solicita un nuevo equipo con Jedoth.' });

    const mainMessage = await channel.send({ embeds: [embed], components: [generateMainButtons()] });

    // Configurar colector de interacciones
    const collector = channel.createMessageComponentCollector({ time: 0 });

    collector.on("collect", async (interaction) => {
      const { customId, member } = interaction;
      const clickedRole = roles.find(role => customId === `team_${role.id}`);
      const currentRole = roles.find(role => member.roles.cache.has(role.id));

      if (clickedRole) {
        const membersList = clickedRole.members.map(m => `- <@${m.user.id}>`).join("\n") || "•";
        const isAlreadyInTeam = currentRole?.id === clickedRole.id;

        // Botón dinámico
        const actionButtons = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(isAlreadyInTeam ? `leave_${clickedRole.id}` : `join_${clickedRole.id}`)
            .setLabel(isAlreadyInTeam ? "Salir" : "Entrar")
            .setStyle(isAlreadyInTeam ? ButtonStyle.Danger : ButtonStyle.Success)
        );

        const embedReply = new EmbedBuilder()
          .setColor("#2b2d31")
          .setTitle(`Información del equipo ${clickedRole.name}`)
          .setDescription(`**Miembros actuales:**\n${membersList}\n\n${isAlreadyInTeam
            ? '> <:advise:1313237521634689107> Ya **estás** en este equipo.'
            : '> <:check:1313237490395648021> Puedes **unirte** a este equipo.'}`);

        return interaction.reply({ embeds: [embedReply], components: [actionButtons], ephemeral: true });
      }

      // Inscribir al usuario
      if (customId.startsWith("join_")) {
        const roleId = customId.split("_")[1];
        const targetRole = roles.find(role => role.id === roleId);

        if (!targetRole || targetRole.members.size >= MAX_MEMBERS_PER_TEAM) {
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor("#FFC868")
                .setDescription('<:advise:1313237521634689107> El equipo ya está completo.')
            ],
            ephemeral: true,
          });
        }

        if (currentRole) await member.roles.remove(currentRole);
        await member.roles.add(targetRole);

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#79E096")
              .setDescription(`<:check:1313237490395648021> Te has unido al equipo **${targetRole.name}**. ¡Prepárate para la batalla!`)
          ],
          ephemeral: true,
        });

        return mainMessage.edit({ components: [generateMainButtons()] });
      }

      // Abandonar equipo
      if (customId.startsWith("leave_")) {
        const roleId = customId.split("_")[1];
        const targetRole = roles.find(role => role.id === roleId);

        if (!targetRole || !currentRole || currentRole.id !== targetRole.id) {
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor("#FFC868")
                .setDescription("No perteneces a este equipo.")
            ],
            ephemeral: true,
          });
        }

        await member.roles.remove(targetRole);

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#FFC868")
              .setDescription(`<:advise:1313237521634689107> Has abandonado el equipo **${targetRole.name}**.`)
          ],
          ephemeral: true,
        });

        return mainMessage.edit({ components: [generateMainButtons()] });
      }
    });
  },
};
