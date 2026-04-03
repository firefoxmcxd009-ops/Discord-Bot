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

// Update message with embed + button
async function updateMessage() {
  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    const data = await getStatus();
    const online = data.online;

    const embedColor = online ? 0x00ff00 : 0xff0000;

    const embed = new EmbedBuilder()
      .setTitle(online ? "🟢 𝙎𝙚𝙧𝙫𝙚𝙧 𝙞𝙨 𝙤𝙣𝙡𝙞𝙣𝙚" : "🔴 𝙎𝙚𝙧𝙫𝙚𝙧 𝙞𝙨 𝙤𝙛𝙛𝙡𝙞𝙣𝙚")
      .setDescription(`IP: \`${SERVER_IP}:${SERVER_PORT}\``)
      .addFields(
        { name: "Port", value: `${SERVER_PORT}`, inline: true },
        { name: "Version", value: online ? data.version || "Unknown" : "Unknown", inline: true },
        { name: "Players", value: online ? `${data.players.online}/${data.players.max}` : "0/0", inline: true },
        { name: "Website", value: "[foxmcstatus.vercel.app](https://foxmcstatus.vercel.app)", inline: true }
      )
      .setColor(embedColor)
      .setFooter({ text: "Last updated" })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Copy Server IP:Port")
        .setStyle(ButtonStyle.Primary)
        .setCustomId("copy_server")
    );

    if (!messageId) {
      const msg = await channel.send({ embeds: [embed], components: [row] });
      messageId = msg.id;

      if (online) await channel.send(`Server restarted 🟢 ONLINE with ${data.players.online} players!`);
      else await channel.send("🔴 Server restarted OFFLINE!");
    } else {
      const msg = await channel.messages.fetch(messageId);
      await msg.edit({ embeds: [embed], components: [row] });

      if (lastOnlineStatus !== null && lastOnlineStatus !== online) {
        if (online) await channel.send(`🟢 Server is back ONLINE! Version: ${data.version || "Unknown"}, Players: ${data.players.online}/${data.players.max}`);
        else await channel.send("🔴 Server went OFFLINE!");
      }
    }

    lastOnlineStatus = online;

    // Player join notification
    if (online && data.players.online > 0) {
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
    await interaction.reply({
      content: `Server IP:Port copied: \`${SERVER_IP}:${SERVER_PORT}\``,
      ephemeral: true
    });
  }
});

client.once("ready", () => {
  console.log("Bot Ready");
  updateMessage();
  setInterval(updateMessage, 5000);
});

client.login(TOKEN);
