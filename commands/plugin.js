import { EmbedBuilder } from "discord.js";
import { Spiget } from "spiget";
const spiget = new Spiget("Darrion's Plugin Bot");

import { XMLHttpRequest } from "xmlhttprequest";
const request = new XMLHttpRequest();

export default {
  name: "plugin",
  description: "Gets a plugin by its resource ID and returns details",
  aliases: [],
  guild: ["all"],
  nsfw: false,
  user_permissions: [],
  bot_permissions: [],
  args_required: 1,
  args_usage: "[resource_id]",
  cooldown: 5,

  async execute(client, message, args) {
    const helpEmbed = new EmbedBuilder();
    let resourceID = args[0];
    try {
      var resource = await spiget.getResource(resourceID);
    } catch (e) {
      client.logger.error(e);
      message.reply(`Uh oh! \`${resourceID}\` is not a valid resource id!`);
      return;
    }
    let author;
    try {
      author = await resource.getAuthor();
    } catch (e) {
      client.logger.error(e);
      message.reply(`Uh oh! I could not find the author for resource \`${resourceID}\``);
      return;
    }

    var apiURL = `https://api.spigotmc.org/legacy/update.php?resource=${args[0]}`;

    request.open("GET", apiURL, true);
    request.send();
    var sent = false;
    request.onreadystatechange = function () {
      var latestVersion = request.responseText;
      if (!latestVersion) return;
      if (sent) return;

      let authorID = author.id;
      let authorName = author.name;
      let authorURL = generateAuthorURL(authorName, authorID);
      let authorAvatarURL = generateAvatarLink(authorID);
      let resourceIconURL = generateResourceIconURL(resource);
      let resourceURL = generateResourceURL(resourceID);

      helpEmbed
        .setAuthor({ name: `Author: ${authorName}`, iconURL: authorAvatarURL, url: authorURL })
        .setColor(message.guild.members.me.displayHexColor)
        .setTitle(`${resource.name}`)
        .setDescription(`${resource.tag}`)
        .addFields([
          { name: "Version", value: `${latestVersion}`, inline: true },
          {
            name: "Download",
            value: resourceURL,
            inline: true,
          },
        ])
        .setTimestamp()
        .setThumbnail(resourceIconURL);
      sent = true;
      return message.reply({ embeds: [helpEmbed] });
    };
  },
};


function generateAvatarLink(authorID) {
  const idStr = authorID.toString();
  const length = idStr.length;
  const splitPoint = Math.ceil(length / 2);
  const firstHalf = idStr.substring(0, splitPoint);
  const url = `https://www.spigotmc.org/data/avatars/l/${firstHalf}/${authorID}.jpg`;
  return url;
}

function generateAuthorURL(authorName, authorID) {
  const idStr = authorID.toString();
  return `https://www.spigotmc.org/members/${authorName}.${authorID}/`;
}

function generateResourceIconURL(resource) {
  return resource.icon.fullUrl()
    .replace("orgdata", "org/data")
    .replace("https://spigotmc.org", "https://www.spigotmc.org");// www must be present. Does not render in embed otherwise. Unknown cause.
}

function generateResourceURL(resourceID) {
  return `https://spigotmc.org/resources/.${resourceID}/`;
}