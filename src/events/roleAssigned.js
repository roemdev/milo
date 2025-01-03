const { Events, EmbedBuilder } = require("discord.js");
const assets = require('../../assets.json');

const BOOSTER_ROLE_ID = "1241182617504579594";
const VIP_ROLE_ID = "1303816942326648884";
const MONITORED_ROLES = [BOOSTER_ROLE_ID, VIP_ROLE_ID];
const NOTIFICATION_CHANNEL_ID = "1173781298721063014";

module.exports = {
  name: Events.GuildMemberUpdate,
  async execute(oldMember, newMember) {
    const addedRoleId = MONITORED_ROLES.find(roleId => 
      !oldMember.roles.cache.has(roleId) && newMember.roles.cache.has(roleId)
    );

    if (!addedRoleId) return;

    const notificationChannel = newMember.guild.channels.cache.get(NOTIFICATION_CHANNEL_ID);
    if (!notificationChannel || !notificationChannel.isTextBased()) return;

    if (addedRoleId === BOOSTER_ROLE_ID) {
      try {
        await newMember.roles.add(VIP_ROLE_ID);
        await newMember.send("¡Gracias por el boost🚀, tu apoyo es increíble! Como agradecimiento, se te ha asignado el rol **VIP**. ¡Disfrútalo!");
      } catch (error) {
        console.error(`Error al asignar el rol VIP a ${newMember.user.tag}:`, error);
      }
    }

    if (addedRoleId === VIP_ROLE_ID) {
      const totalVipMembers = newMember.guild.members.cache.filter(member => 
        member.roles.cache.has(VIP_ROLE_ID)
      ).size;

      const notificationEmbed = new EmbedBuilder()
        .setAuthor({ name: newMember.user.tag, iconURL: newMember.user.displayAvatarURL() })
        .setTitle(`⭐ __${totalVipMembers} VIP__`)
        .setColor(assets.color.base)
        .setDescription(
          `* ¡Un nuevo VIP se alza!\n` +
          `* Haz clic [aquí](https://discord.com/channels/815280751586050098/1247632279027843152) para ver tus beneficios.`
        )
        .setThumbnail(newMember.user.displayAvatarURL());

      try {
        await notificationChannel.send({
          content: `<@${newMember.user.id}>`,
          embeds: [notificationEmbed],
        });
      } catch (error) {
        console.error(`Error al enviar la notificación para ${newMember.user.tag}:`, error);
      }
    }
  },
};
