const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { responseEmbed } = require('../../utils/responseEmbed');

module.exports = {
    data: new SlashCommandBuilder()
        .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers)
        .setName('torneo-mc')
        .setDescription('Envía el embed de inscripción al torneo para todos los miembros.'),
    async execute(interaction) {
        // Confirmar ejecución del comando
        await responseEmbed(
            'agree',
            'El comando para el torneo fue enviado con éxito.',
            interaction
        );

        // Embed principal del torneo
        const torneoEmbed = new EmbedBuilder()
            .setColor("NotQuiteBlack")
            .setTitle('🏆 ARKANIA RIFT')
            .setDescription('¿Estás listo para enfrentarte a los mejores y demostrar tu supremacía en el Puente del Progreso? Inscríbete ahora y únete a esta épica contienda donde cada jugada cuenta y solo el más fuerte llegará a la cima. ¡No dejes que te lo cuenten, haz historia en ARKANIA RIFT! **¡Este es tu momento!**')
            .addFields(
                { name: 'Fechas', value: 'Demuestra tu valía del 23 al 14 de diciembre en dos grandes fases de máxima competitividad.' },
                { name: 'Criterios', value: '¿Zaun o Piltóver? Aplasta a tu rival en el Puente del Progreso ARAM en un `1 VS 1` con un campeón significativo de tu lado.' },
                { name: 'Premios', value: 'Compite en este gran torneo y vive al máximo la experiencia Arcane ganando el **Pase de Batalla de Arcane**.' }
            )
            .setImage('https://i.imgur.com/cUq8oRq.png');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('inscribirme')
                .setLabel('Inscribirme')
                .setStyle(ButtonStyle.Primary)
        );

        // Enviar el embed del torneo
        await interaction.channel.send({ embeds: [torneoEmbed], components: [row] });

        // Recolector de botones
        const filter = (i) => ['inscribirme', 'confirmar_inscripcion', 'salir_torneo'].includes(i.customId);
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 0 });

        collector.on('collect', async (i) => {
            const requiredRoleId = '1311799987474010113';
            const filePath = path.join(__dirname, 'inscritos_torneo.json');
            let inscritos = [];

            if (fs.existsSync(filePath)) {
                inscritos = JSON.parse(fs.readFileSync(filePath));
            }

            if (i.customId === 'inscribirme') {
                // Verificar si el usuario tiene el rol necesario
                if (!i.member.roles.cache.has(requiredRoleId)) {
                    await responseEmbed(
                        'warn',
                        'No tienes el rol necesario para inscribirte en el torneo.',
                        i
                    );
                    return;
                }

                // Verificar si ya está inscrito
                const yaInscrito = inscritos.some(inscrito => inscrito.discordId === i.user.id);

                const embed = new EmbedBuilder();
                const rowButtons = new ActionRowBuilder();

                if (yaInscrito) {
                    embed.setColor("#FFC868")
                        .setDescription(`<@${i.user.id}>: Ya estás inscrito en el torneo. Si deseas salir, presiona el botón a continuación.`);

                    rowButtons.addComponents(
                        new ButtonBuilder()
                            .setCustomId('salir_torneo')
                            .setLabel('Salir del torneo')
                            .setStyle(ButtonStyle.Danger)
                    );
                } else {
                    embed.setColor("NotQuiteBlack")
                        .setDescription(`<@${i.user.id}>: Por favor, confirma tu inscripción al torneo.`);

                    rowButtons.addComponents(
                        new ButtonBuilder()
                            .setCustomId('confirmar_inscripcion')
                            .setLabel('Confirmar inscripción')
                            .setStyle(ButtonStyle.Success)
                    );
                }

                // Enviar el mensaje con el embed y los botones juntos
                await i.reply({ embeds: [embed], components: [rowButtons], ephemeral: true });
            }

            if (i.customId === 'confirmar_inscripcion') {
                // Confirmar la inscripción y guardar en el JSON
                inscritos.push({
                    invocador: i.user.username,
                    discordId: i.user.id
                });

                fs.writeFileSync(filePath, JSON.stringify(inscritos, null, 2));

                await responseEmbed(
                    'agree',
                    '¡Tu inscripción al torneo ha sido confirmada! ¡Buena suerte!',
                    i
                );
            }

            if (i.customId === 'salir_torneo') {
                // Eliminar al usuario del JSON
                inscritos = inscritos.filter(inscrito => inscrito.discordId !== i.user.id);

                fs.writeFileSync(filePath, JSON.stringify(inscritos, null, 2));

                await responseEmbed(
                    'agree',
                    'Has salido del torneo con éxito.',
                    i
                );
            }
        });
    },
};
