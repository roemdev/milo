const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const assets = require('../../../assets.json');

const userCooldown = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('minar')
    .setDescription('Este comando te permite minar y obtener un ítem.'),

  async execute(interaction) {
    const connection = interaction.client.dbConnection;
    const userId = interaction.user.id;
    const cooldownDuration = 14400000; // 1 minuto
    const currentTime = Date.now();

    // Verificar cooldown
    const lastMineTime = userCooldown.get(userId);
    if (lastMineTime && currentTime - lastMineTime < cooldownDuration) {
      const nextPrayTime = Math.floor((lastMineTime + cooldownDuration) / 1000);
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(assets.color.red)
            .setDescription(`${assets.emoji.deny} Todavía no puedes minar. Podrás intentarlo de nuevo: <t:${nextPrayTime}:R>.`)
        ],
        flags: MessageFlags.Ephemeral
      });
    }

    try {
      // Obtener ítems de la categoría "mine" con peso
      const [itemRows] = await connection.query(
        'SELECT * FROM currency_items WHERE category = "mine" AND weight IS NOT NULL'
      );

      if (itemRows.length === 0) {
        throw new Error('No se encontraron ítems en la categoría "mine".');
      }

      // Calcular el peso total para la selección aleatoria
      const totalWeight = itemRows.reduce((sum, item) => sum + item.weight, 0);

      // Generar un número aleatorio basado en el peso total
      const randomWeight = Math.random() * totalWeight;

      // Determinar el ítem según el peso
      let accumulatedWeight = 0;
      let selectedItem = null;

      for (const item of itemRows) {
        accumulatedWeight += item.weight;
        if (randomWeight <= accumulatedWeight) {
          selectedItem = item;
          break;
        }
      }

      if (!selectedItem) {
        throw new Error('Error al seleccionar un ítem.');
      }

      // Actualizar el inventario del usuario
      const [userItemRows] = await connection.query(
        'SELECT * FROM currency_user_inventory WHERE user_id = ? AND item_id = ?',
        [userId, selectedItem.item_id]
      );

      if (userItemRows.length > 0) {
        // Si el usuario ya tiene el ítem, solo aumentar su cantidad
        const newQuantity = userItemRows[0].quantity + 1;
        const [updateResult] = await connection.query(
          'UPDATE currency_user_inventory SET quantity = ? WHERE user_id = ? AND item_id = ?',
          [newQuantity, userId, selectedItem.item_id]
        );

        if (updateResult.affectedRows === 0) {
          throw new Error('No se pudo actualizar el inventario del usuario.');
        }
      } else {
        // Si el usuario no tiene el ítem, insertarlo en su inventario
        const [insertResult] = await connection.query(
          'INSERT INTO currency_user_inventory (user_id, item_id, quantity) VALUES (?, ?, ?)',
          [userId, selectedItem.item_id, 1]
        );

        if (insertResult.affectedRows === 0) {
          throw new Error('No se pudo insertar el ítem en el inventario del usuario.');
        }
      }

      // Actualizar cooldown
      userCooldown.set(userId, currentTime);

      // Responder al usuario con el ítem obtenido y su valor
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(assets.color.green)
            .setDescription(`⛏️ ¡Comenzaste a minar y obtuviste un **${selectedItem.name}**!\n-# Valor: **🔸${selectedItem.value}**`)
        ]
      });
    } catch (error) {
      console.error('Error al procesar el comando minar:', error);
      return interaction.reply({
        content: 'Hubo un problema. Por favor, intenta de nuevo más tarde.',
        flags: MessageFlags.Ephemeral
      });
    }
  }
};
