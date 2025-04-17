import Discord from "discord.js";
import { EmbedBuilder } from "discord.js";

import fs from "fs";
import { Spiget } from "spiget";
const spiget = new Spiget("Darrion's Plugin Bot");

import { XMLHttpRequest } from "xmlhttprequest";

import config from "./config.json" with { type: 'json' }
import logger from "./util/logger.js";
import packageData from "./package.json" with { type: 'json' }

/**
 * Set up ALL THE THINGS
 */
const client = {
  bot: new Discord.Client({
    intents: [
      Discord.IntentsBitField.Flags.Guilds,
      Discord.IntentsBitField.Flags.GuildMessages,
      Discord.IntentsBitField.Flags.MessageContent,
    ],
    partials: ["MESSAGE", "CHANNEL"],
  }),
  commands: new Map(),
  aliases: new Map(),
  cooldowns: new Map(),
  config,
  logger,
  packageData,
};

client.logger.info("PluginBot by Darrionat booting...");

/**
 * Load all ".js" files in ./events and listen for emits
 */
const eventFiles = fs
  .readdirSync("./events")
  .filter((file) => file.endsWith(".js"));

for (const eventFile of eventFiles) {
  const event = (await import(`./events/${eventFile}`)).default;
  client.bot.on(event.name, (...args) =>
    event.execute(client, ...args).catch(logger.error)
  );
}

client.logger.info(`Loaded ${eventFiles.length} events`);

/**
 * Load all ".js" files in ./commands and add to client.commands Map
 * Also check the file for assigned aliases and add to client.aliases Map
 */
const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));

for (const commandFile of commandFiles) {
  const command = (await import(`./commands/${commandFile}`)).default;
  client.commands.set(command.name, command);

  if (command.aliases && command.aliases.length > 0) {
    for (const alias of command.aliases) {
      client.aliases.set(alias, command.name);
    }
  }
}
/*
    Checks for updates every 1 minute
    1m = 60 * 1000 ms;
*/
setInterval(checkUpdates, 60 * 5 * 1000);

async function checkUpdates() {
  try {
    var serverDataDir = fs.readdirSync("./serverdata");
  } catch (error) {
    client.logger.info("No ./serverdata directory", "warn");
    return;
  }
  const serverFiles = serverDataDir.filter((file) => file.endsWith(".json"));

  for (const serverFile of serverFiles) {
    const filePath = `./serverdata/${serverFile}`;
    let jsonExistingData = JSON.parse(getJSONFileData(filePath));

    for (let watchedResource of jsonExistingData.watchedResources) {
      const updateEmbed = new EmbedBuilder();
      const id = watchedResource.resourceID;
      let channel;
      try {
        channel = await client.bot.channels.fetch(watchedResource.channelID);
      } catch (e) {
        console.error(`Could not find channel ${watchedResource.channelID}`);
        console.error(e);
        continue
      }

      let resource;
      try {
        resource = await spiget.getResource(id);
      } catch (e) {
        logger.error(e);
        return;
      }
      if (resource == undefined) {
        continue;
      }

      let author;
      try {
        author = await resource.getAuthor();
      } catch (e) {
        logger.error(e);
        return;
      }


      let image = resource.icon.fullUrl();
      image = image.replace("orgdata", "org/data");

      const latestVersion = await getResourceVersion(id);

      // Up to date
      if (watchedResource.lastCheckedVersion == latestVersion) {
        continue;
      }

      let updateDesc = await getUpdateDescription(id);
      if (updateDesc.length > 1024)
        updateDesc = `Description greater than 1024 characters`;

      let authorID = author.id;
      let authorName = author.name;
      let authorURL = generateAuthorURL(authorName, authorID);
      let authorAvatarURL = generateAvatarLink(authorID);
      let resourceIconURL = generateResourceIconURL(resource);
      let resourceURL = `https://spigotmc.org/resources/.${id}/`;

      updateEmbed
        .setAuthor({ name: `Author: ${authorName}`, iconURL: authorAvatarURL, url: authorURL })
        .setColor(channel.guild.members.me.displayHexColor)
        .setTitle(`An update for ${resource.name} is available`)
        .setDescription(`${resource.tag}`)
        .addFields([
          { name: "Version", value: `${latestVersion}`, inline: false },
          { name: "Update Description", value: updateDesc, inline: false },
          {
            name: "Download",
            value: resourceURL,
            inline: false,
          },
        ])
        .setThumbnail(resourceIconURL)
        .setTimestamp();
      watchedResource.lastCheckedVersion = latestVersion;
      fs.writeFile(filePath, JSON.stringify(jsonExistingData), (err) => {
        if (err) throw err;
      });
      client.bot.channels.cache
        .get(watchedResource.channelID)
        .send({ embeds: [updateEmbed] })
        .catch(console.error);

      continue;
    }
  }
}

async function getResourceVersion(id) {
  const idRequest = new XMLHttpRequest();
  var latestVersion = null;

  idRequest.onreadystatechange = function () {
    const latestVersionData = idRequest.responseText;
    const dataJSON = JSON.parse(latestVersionData);
    latestVersion = dataJSON.name;
  };
  idRequest.open(
    "GET",
    `https://api.spiget.org/v2/resources/${id}/versions/latest`,
    false
  );
  idRequest.send();
  while (latestVersion == null) { }
  return latestVersion;
}

async function getUpdateDescription(id) {
  const updateRequest = new XMLHttpRequest();
  var updateDesc = null;

  updateRequest.onreadystatechange = function () {
    const latestUpdate = updateRequest.responseText;
    const data = JSON.parse(latestUpdate);
    updateDesc = formatText(Buffer.from(data.description, "base64").toString());
  };
  updateRequest.open(
    "GET",
    `https://api.spiget.org/v2/resources/${id}/updates/latest`,
    false
  );
  updateRequest.send();
  while (updateDesc == null) { }
  return updateDesc;
}

function getJSONFileData(filePath) {
  return fs.readFileSync(filePath, (err, data) => {
    if (err) return;
    return JSON.parse(data);
  });
}

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

function formatText(description) {
  description = description.replace(/<b>/gi, "**");
  description = description.replace(/<\/b>/gi, "**");
  description = description.replace(/<i>/gi, "*");
  description = description.replace(/<\/i>/gi, "**");
  description = description.replace(/<ul>/gi, "");
  description = description.replace(/<\/ul>/gi, "");
  description = description.replace(/<li>/gi, "");
  description = description.replace(/<\/li>/gi, "");
  description = description.replace(/<br>/gi, "");
  return description;
}

client.logger.info(`Registered ${commandFiles.length} commands`);

client.logger.info("Logging in...");
client.bot.login(client.config.token);
