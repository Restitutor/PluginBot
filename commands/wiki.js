import { EmbedBuilder } from "discord.js";
export default {
  name: "wiki",
  description: "The Wiki link!",
  aliases: [],
  guild: ["all"],
  nsfw: false,
  user_permissions: [],
  bot_permissions: [],
  args_required: 0,
  args_usage: "",
  cooldown: 5,

  async execute(client, message, args) {
    const helpEmbed = new EmbedBuilder();
    helpEmbed
      .setURL("https://wiki.darrionatplugins.com")
      .setColor(message.guild.members.me.displayHexColor)
      .setTitle(`Darrionat's Plugins Wiki`)
      .setDescription(
        `Click on this link to learn all about Darrionat's plugins and this bot!`
      );
    message.reply({ embeds: [helpEmbed] });
  },
};
