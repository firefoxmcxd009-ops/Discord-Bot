import express from "express";
import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

// --------------------
// Dummy Web Server
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

// Fetch status
async function getStatus() {
  const res = await fetch(`https://api.mcsrvstat.us/2/${SERVER_IP}:${SERVER_PORT}`);
  return res.json();
}

// Clean MOTD
function formatMOTD(rawMotd) {
  if (!rawMotd || rawMotd.length === 0) return "No MOTD";
  return rawMotd.join(" | ").replace(/§[0-9a-fklmnor]/gi, "");
}

// Create embed helper (ALL messages use this)
function createEmbed(title, description, color) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp();
}

// Main update
async function updateMessage() {
  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    const data = await getStatus();
    const online = data.online;

    const color = online ? 0x2ecc71 : 0xe74c3c;

    const embed = new EmbedBuilder()
      .setTitle(online ? "🟢 Server Online" : "🔴 Server Offline")
      .setDescription(`**IP:** \`${SERVER_IP}:${SERVER_PORT}\``)
      .addFields(
        { name: "Port", value: `${SERVER_PORT}`, inline: true },
        { name: "Version", value: online ? data.version || "Unknown" : "Unknown", inline: true },
        { name: "Players", value: online ? `${data.players.online}/${data.players.max}` : "0/0", inline: true },
        { name: "MOTD", value: online ? formatMOTD(data.motd?.clean) : "Server offline", inline: false },
        { name: "Website", value: "[foxmcstatus.vercel.app](https://foxmcstatus.vercel.app)", inline: true }
      )
      .setColor(color)
      .setFooter({ text: "Live Status" })
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

      // Restart message
      const restartEmbed = createEmbed(
        "🔄 Server Restart",
        online
          ? `Server is ONLINE with ${data.players.online} players`
          : `Server is currently OFFLINE`,
        color
      );
      await channel.send({ embeds: [restartEmbed] });

    } else {
      const msg = await channel.messages.fetch(messageId);
      await msg.edit({ embeds: [embed], components: [row] });

      // Status change
      if (lastOnlineStatus !== null && lastOnlineStatus !== online) {
        const statusEmbed = createEmbed(
          online ? "🟢 Server Back Online" : "🔴 Server Went Offline",
          online
            ? `Players: ${data.players.online}/${data.players.max}\nVersion: ${data.version || "Unknown"}`
            : `Server is currently offline`,
          color
        );
        await channel.send({ embeds: [statusEmbed] });
      }
    }

    // Player join/leave
    if (online) {
      if (!updateMessage.previousPlayers) updateMessage.previousPlayers = 0;

      const current = data.players.online;
      const previous = updateMessage.previousPlayers;

      if (current > previous) {
        const embedJoin = createEmbed(
          "🎉 Player Joined",
          `${current - previous} player(s) joined!\nNow: ${current}/${data.players.max}`,
          0x2ecc71
        );
        await channel.send({ embeds: [embedJoin] });
      }

      if (current < previous) {
        const embedLeave = createEmbed(
          "👋 Player Left",
          `${previous - current} player(s) left!\nNow: ${current}/${data.players.max}`,
          0xe74c3c
        );
        await channel.send({ embeds: [embedLeave] });
      }

      updateMessage.previousPlayers = current;
    }

    lastOnlineStatus = online;

  } catch (err) {
    console.error("Error:", err);
  }
}

// Button interaction
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === "copy_server") {
    await interaction.reply({
      content: `Server IP:Port: \`${SERVER_IP}:${SERVER_PORT}\``,
      ephemeral: true
    });
  }
});

client.once("ready", () => {
  console.log("Bot Ready");
  updateMessage();
  setInterval(updateMessage, 1000);
});

client.login(TOKEN);
