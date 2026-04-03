import express from "express";
import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

// --------------------
// Dummy Web Server for Render
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
const SERVER_PORT = 62080;

let messageId = null;
let lastOnlineStatus = null;

// Fetch Minecraft server status
async function getStatus() {
  const res = await fetch(`https://api.mcsrvstat.us/2/${SERVER_IP}:${SERVER_PORT}`);
  return res.json();
}

// Format MOTD nicely
function formatMOTD(rawMotd) {
  if (!rawMotd || rawMotd.length === 0) return "No MOTD";
  return rawMotd.join(" | ").replace(/§[0-9a-fklmnor]/gi, ""); // remove Minecraft codes
}

// Update message with embed + button
async function updateMessage() {
  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    const data = await getStatus();

    const serverStatusOnline = data.online;
    const embed = new EmbedBuilder()
      .setTitle(serverStatusOnline ? "🟢 Minecraft Server Online" : "🔴 Minecraft Server Offline")
      .setDescription(`**IP:** \`${SERVER_IP}:${SERVER_PORT}\``)
      .addFields(
        { name: "Version", value: serverStatusOnline ? data.version || "Unknown" : "Unknown", inline: true },
        { name: "Players", value: serverStatusOnline ? `${data.players.online}/${data.players.max}` : "0/0", inline: true },
        { name: "MOTD", value: serverStatusOnline ? formatMOTD(data.motd?.clean) : "Server offline", inline: false },
        { name: "Website", value: "[foxmcstatus.vercel.app](https://foxmcstatus.vercel.app)", inline: true }
      )
      .setColor(serverStatusOnline ? 0x00ff00 : 0xff0000)
      .setFooter({ text: "Last updated" })
      .setTimestamp();

    // Create button
    const button = new ButtonBuilder()
      .setLabel("Copy Server IP:Port")
      .setStyle(ButtonStyle.Primary)
      .setCustomId("copy_server"); // custom interaction id

    const row = new ActionRowBuilder().addComponents(button);

    if (!messageId) {
      const msg = await channel.send({ embeds: [embed], components: [row] });
      messageId = msg.id;

      // Notify server restart
      if (serverStatusOnline) await channel.send(`Server restarted 🟢 ONLINE with ${data.players.online} players!`);
      else await channel.send("Server restarted 🔴 OFFLINE.");
    } else {
      const msg = await channel.messages.fetch(messageId);
      await msg.edit({ embeds: [embed], components: [row] });

      // Online/offline change notification
      if (lastOnlineStatus !== null && lastOnlineStatus !== serverStatusOnline) {
        if (serverStatusOnline) await channel.send(`Server is back 🟢 ONLINE! Players: ${data.players.online}`);
        else await channel.send("Server went 🔴 OFFLINE!");
      }
    }

    lastOnlineStatus = serverStatusOnline;

    // Player join notification
    if (serverStatusOnline && data.players.online > 0) {
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

// Handle button interaction
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;
  if (interaction.customId === "copy_server") {
    await interaction.reply({ content: `Server IP:Port copied: \`${SERVER_IP}:${SERVER_PORT}\``, ephemeral: true });
    // ephemeral=true → only the user sees the message
  }
});

client.once("ready", () => {
  console.log("Bot Ready");
  updateMessage();
  setInterval(updateMessage, 30000); // every 30s
});

client.login(TOKEN);
