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
let lastOnlineStatus = null; // Track last server online/offline

async function getStatus() {
  const res = await fetch(`https://api.mcsrvstat.us/2/${SERVER_IP}`);
  return res.json();
}

// --------------------
// Update status message
// --------------------
async function updateMessage() {
  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    const data = await getStatus();

    let embed;
    if (data.online) {
      embed = new EmbedBuilder()
        .setTitle("🟢 Server Online")
        .setDescription(`IP: ${SERVER_IP}`)
        .addFields({ name: "Players", value: `${data.players.online}/${data.players.max}` })
        .setColor(0x00ff00)
        .setTimestamp();
    } else {
      embed = new EmbedBuilder()
        .setTitle("🔴 Server Offline")
        .setDescription(`IP: ${SERVER_IP}`)
        .setColor(0xff0000)
        .setTimestamp();
    }

    // --------------------
    // Send new message if first time
    // --------------------
    if (!messageId) {
      const msg = await channel.send({ embeds: [embed] });
      messageId = msg.id;

      // Notify on server restart
      if (data.online) {
        await channel.send(`Server has restarted and is now 🟢 ONLINE with ${data.players.online} players.`);
      } else {
        await channel.send(`Server has restarted and is 🔴 OFFLINE.`);
      }
    } else {
      const msg = await channel.messages.fetch(messageId);
      await msg.edit({ embeds: [embed] });

      // Notify if server went online/offline change
      if (lastOnlineStatus !== null && lastOnlineStatus !== data.online) {
        if (data.online) {
          await channel.send(`Server is back 🟢 ONLINE! Players online: ${data.players.online}`);
        } else {
          await channel.send(`Server went 🔴 OFFLINE!`);
        }
      }
    }

    lastOnlineStatus = data.online;

    // Notify when new player joins
    if (data.online && data.players.online > 0) {
      // Keep track of online players
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

client.once("ready", () => {
  console.log("Bot Ready");
  updateMessage();
  setInterval(updateMessage, 30000); // Update every 30s
});

client.login(TOKEN);
