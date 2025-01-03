const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = {
    data: new SlashCommandBuilder()
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageEvents)
        .setName('resultado')
        .setDescription('Maneja y visualiza los resultados del torneo.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('ver')
                .setDescription('Muestra la imagen de los resultados actuales.'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('cargar')
                .setDescription('Carga una nueva imagen de resultados.')
                .addAttachmentOption(option =>
                    option
                        .setName('imagen')
                        .setDescription('La imagen de los resultados.')
                        .setRequired(true))),
    async execute(interaction) {
        const userIdAllowed = '271683421065969664';
        const resultadosPath = path.join(__dirname, 'resultados.png');

        if (interaction.options.getSubcommand() === 'ver') {
            // Mostrar la imagen guardada
            if (fs.existsSync(resultadosPath)) {
                await interaction.reply({ files: [resultadosPath] });
            } else {
                const embed = new EmbedBuilder()
                    .setColor('#F87171') // Rojo (negativo)
                    .setDescription('<:deny:1313237501359558809> No hay resultados cargados actualmente.');
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        } else if (interaction.options.getSubcommand() === 'cargar') {
            // Verificar que sea el usuario permitido
            if (interaction.user.id !== userIdAllowed) {
                const embed = new EmbedBuilder()
                    .setColor('#F87171') // Rojo (negativo)
                    .setDescription('<:deny:1313237501359558809> No tienes permiso para usar este comando.');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            // Guardar la imagen cargada
            const imagen = interaction.options.getAttachment('imagen');
            if (!imagen.contentType.startsWith('image/')) {
                const embed = new EmbedBuilder()
                    .setColor('#F87171') // Rojo (negativo)
                    .setDescription('<:deny:1313237501359558809> El archivo cargado no es una imagen válida.');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            // Descargar y guardar la imagen
            const response = await fetch(imagen.url);
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            fs.writeFileSync(resultadosPath, buffer);

            const embed = new EmbedBuilder()
                .setColor('#79E096') // Verde (positivo)
                .setDescription('<:check:1313237490395648021> ¡Imagen de resultados cargada exitosamente!');
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
};
