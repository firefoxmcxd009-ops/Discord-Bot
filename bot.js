import express from "express";
import { Client, GatewayIntentBits, EmbedBuilder } from "discord.js";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

// --------------------
// Dummy Web Server for Render free plan
// --------------------
const app = express();
const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => res.send("Bot is running!"));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// --------------------
// Discord Bot
// --------------------
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const SERVER_IP = process.env.SERVER_IP;

let messageId = null;
let lastOnlineStatus = null;

// Function to fetch server status
async function getStatus() {
  const res = await fetch(`https://api.mcsrvstat.us/2/${SERVER_IP}`);
  return res.json();
}

// Function to format MOTD nicely (colored emojis or markdown)
function formatMOTD(rawMotd) {
  // rawMotd is an array of strings
  if (!rawMotd || rawMotd.length === 0) return "No MOTD";
  return rawMotd.join(" | ").replace(/§[0-9a-fklmnor]/gi, ""); // remove codes if any
}

// Update Discord embed
async function updateMessage() {
  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    const data = await getStatus();

    let embed;
    if (data.online) {
      embed = new EmbedBuilder()
        .setTitle("🟢 Minecraft Server Online")
        .setDescription(`**IP:** \`${SERVER_IP}\``)
        .addFields(
          { name: "Version", value: data.version || "Unknown", inline: true },
          { name: "Players", value: `${data.players.online}/${data.players.max}`, inline: true },
          { name: "MOTD", value: formatMOTD(data.motd?.clean), inline: false },
          { name: "Website", value: "[foxmcstatus.vercel.app](https://foxmcstatus.vercel.app)", inline: true }
        )
        .setColor(0x00ff00)
        .setFooter({ text: "Last updated" })
        .setTimestamp();
    } else {
      embed = new EmbedBuilder()
        .setTitle("🔴 Minecraft Server Offline")
        .setDescription(`**IP:** \`${SERVER_IP}\``)
        .addFields(
          { name: "Version", value: "Unknown", inline: true },
          { name: "Players", value: "0/0", inline: true },
          { name: "MOTD", value: "Server is offline", inline: false },
          { name: "Website", value: "[foxmcstatus.vercel.app](https://foxmcstatus.vercel.app)", inline: true }
        )
        .setColor(0xff0000)
        .setFooter({ text: "Last updated" })
        .setTimestamp();
    }

    // First message or edit
    if (!messageId) {
      const msg = await channel.send({ embeds: [embed] });
      messageId = msg.id;

      // Notify server restart
      if (data.online) await channel.send(`Server restarted and is now 🟢 ONLINE with ${data.players.online} players!`);
      else await channel.send("Server restarted and is 🔴 OFFLINE.");
    } else {
      const msg = await channel.messages.fetch(messageId);
      await msg.edit({ embeds: [embed] });

      // Notify online/offline change
      if (lastOnlineStatus !== null && lastOnlineStatus !== data.online) {
        if (data.online) await channel.send(`Server is back 🟢 ONLINE! Players online: ${data.players.online}`);
        else await channel.send("Server went 🔴 OFFLINE!");
      }
    }

    lastOnlineStatus = data.online;

    // Notify new players
    if (data.online && data.players.online > 0) {
      if (!updateMessage.previousPlayers) updateMessage.previousPlayers = 0;
      if (data.players.online > updateMessage.previousPlayers) {
        const newPlayers = data.players.online - updateMessage.previousPlayers;
        await channel.send(`🎉 ${newPlayers} new player(s) joined the server!`);
      }
      updateMessage.previousPlayers = data.players.online;
    }

  } catch (err) {
    console.error("Error updating message:", err);
  }
}

// Bot ready
client.once("ready", () => {
  console.log("Bot Ready");
  updateMessage();
  setInterval(updateMessage, 30000); // every 30s
});

// Login
client.login(TOKEN);
