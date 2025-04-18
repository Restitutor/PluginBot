import Discord from "discord.js";
import { EmbedBuilder } from "discord.js";
const darrrionID = "163454178365145088";
export default {
  name: "help",
  description: "All the bot's commands and info on usage!",
  aliases: ["commands", "cmds"],
  guild: ["all"],
  nsfw: false,
  user_permissions: [],
  bot_permissions: [],
  args_required: 0,
  args_usage: "[commandName]",
  cooldown: 0,

  async execute(client, message, args) {
    const helpEmbed = new EmbedBuilder();
    if (!args[0]) {
      const commandList = `\`${Array.from(client.commands.keys()).join(
        "` `"
      )}\``;
      const { me } = message.guild.members;
      const displayName = me.displayName
        ? me.displayName
        : client.user.username;

      let darrionUser = await client.bot.users.fetch(darrrionID);
      var darrionAvatar = darrionUser.displayAvatarURL();
      helpEmbed
        .setAuthor({
          name: "Author: @Darrionat",
          iconURL: darrionAvatar,
          url: "https://www.github.com/Darrionat",
        })
        .setColor(me.displayHexColor)
        .setTitle(`${displayName} Help`)
        .setDescription(commandList)
        .setFooter({
          text: `Use \`${client.config.prefix}${this.name} ${this.args_usage}\` for more detailed info!`,
        });
    } else {
      const requestedCommand = args[0].replace(client.config.prefix, "");
      const command =
        client.commands.get(requestedCommand) ||
        client.commands.get(client.aliases.get(requestedCommand));

      if (
        !command ||
        (!command.guild.includes("all") &&
          !command.guild.includes(message.guild.id))
      )
        return message.reply(
          `I can't find \`${requestedCommand}\` in the command list!`
        );

      helpEmbed
        .setTitle(`Command: ${command.name}`)
        .setDescription(command.description)
        .addFields([
          {
            name: "Usage",
            value: `\`${client.config.prefix}${command.name} ${command.args_usage}\``,
          },
          { name: "NSFW", value: `${command.nsfw}` },
          { name: "Cooldown", value: `${command.cooldown} seconds` },
        ]);

      if (command.aliases && command.aliases.length > 0)
        helpEmbed.addFields([
          { name: "Aliases", value: `\`${command.aliases.join("` `")}\`` },
        ]);

      if (command.user_permissions && command.user_permissions.length > 0)
        helpEmbed.addFields([
          {
            name: "Permissions",
            value: `\`${command.user_permissions.join("` `")}\``,
          },
        ]);

      helpEmbed.setFooter({
        text: `Use \`${client.config.prefix}${this.name}\` to see all my commands!`,
      });
    }
    return message.reply({ embeds: [helpEmbed] });
  },
};
