const { MessageFlags, EmbedBuilder } = require('discord.js');
const assets = require('../../assets.json');

module.exports = async function handleButton(interaction) {
  const [action, giveawayId] = interaction.customId.split('_');

  if (action === 'enterButton') {
    try {
      const connection = interaction.client.dbConnection;

      // Verificar si el sorteo existe
      const [giveaway] = await connection.query(
        `SELECT * FROM giveaways WHERE id = ? AND status = 'active'`,
        [giveawayId]
      );

      if (giveaway.length === 0) {
        return interaction.reply({
          content: 'Este sorteo ya ha terminado.',
          flags: MessageFlags.Ephemeral,
        });
      }

      // Consultar si el usuario tiene la entrada al sorteo
      const [userInventory] = await connection.query(
        `SELECT quantity FROM currency_user_inventory WHERE user_id = ? AND store_item_id = ?`,
        [interaction.user.id, 2] // '2' es el store_item_id de la entrada al sorteo
      );

      if (userInventory.length === 0 || userInventory[0].quantity < 1) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(assets.color.red)
              .setTitle(`${assets.emoji.deny} Sin entrada`)
              .setDescription('No tienes una entrada al sorteo. Debes comprarla en la tienda.')
          ],
          flags: MessageFlags.Ephemeral,
        });
      }

      // Restar una entrada al sorteo
      await connection.query(
        `UPDATE currency_user_inventory SET quantity = quantity - 1 WHERE user_id = ? AND store_item_id = ?`,
        [interaction.user.id, 2]
      );

      // Verificar si la cantidad de entradas es ahora 0 y eliminar el ítem si es necesario
      const [updatedInventory] = await connection.query(
        `SELECT quantity FROM currency_user_inventory WHERE user_id = ? AND store_item_id = ?`,
        [interaction.user.id, 2]
      );

      // Si la cantidad es 0, eliminar el ítem del inventario
      if (updatedInventory[0].quantity === 0) {
        await connection.query(
          `DELETE FROM currency_user_inventory WHERE user_id = ? AND store_item_id = ?`,
          [interaction.user.id, 2]
        );
      }

      // Verificar si el usuario ya está inscrito en el sorteo
      const [entry] = await connection.query(
        `SELECT * FROM giveaway_entries WHERE giveaway_id = ? AND user_id = ?`,
        [giveawayId, interaction.user.id]
      );

      if (entry.length > 0) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(assets.color.red)
              .setTitle(`${assets.emoji.deny} Ya estás participando`)
              .setDescription('Si deseas abandonar el sorteo, contacta al anfitrión.')
          ],
          flags: MessageFlags.Ephemeral,
        });
      }

      // Guardar la entrada en la base de datos
      await connection.query(
        `INSERT INTO giveaway_entries (giveaway_id, user_id) VALUES (?, ?)`,
        [giveawayId, interaction.user.id]
      );

      // Obtener el número actualizado de entradas
      const [entries] = await connection.query(
        `SELECT COUNT(*) AS entryCount FROM giveaway_entries WHERE giveaway_id = ?`,
        [giveawayId]
      );

      const entryCount = entries[0].entryCount;

      // Obtener el mensaje original del sorteo
      const channel = await interaction.client.channels.fetch(giveaway[0].channel_id);
      const message = await channel.messages.fetch(giveaway[0].message_id);

      // Clonar el embed original
      const embed = EmbedBuilder.from(message.embeds[0]);

      // Extraer la descripción y actualizar solo el número de entradas
      let description = embed.data.description || '';
      description = description.replace(/Entradas: \*\*(\d+)\*\*/, `Entradas: **${entryCount}**`);

      // Actualizar la descripción en el embed
      embed.setDescription(description);

      // Editar el mensaje con el embed actualizado
      await message.edit({ embeds: [embed] });

      // Responder al usuario
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(assets.color.green)
            .setTitle(`${assets.emoji.check} Inscrito`)
            .setDescription('¡Has ingresado al sorteo! ¡Mucha suerte!')
        ],
        flags: MessageFlags.Ephemeral,
      });

    } catch (error) {
      console.error('Error al manejar la entrada:', error);
      await interaction.reply({
        content: 'Hubo un error al ingresar al sorteo.',
        flags: MessageFlags.Ephemeral,
      });
    }
  }
};