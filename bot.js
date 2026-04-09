import express from "express";
import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => res.send("Bot is running!"));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const SERVER_IP = process.env.SERVER_IP;
const SERVER_PORT = 62080;

let messageId = null;
let lastData = null; // រក្សាទុកទិន្នន័យចាស់ដើម្បីប្រៀបធៀប

// ប្តូរមកប្រើ API ផ្សេងដែល Update លឿនជាង (mcapi.us ឬ minetools.net) 
// ឬរក្សាទុក mcsrvstat តែត្រូវយល់ថាវាមាន cache
async function getStatus() {
  try {
    const res = await fetch(`https://api.mcstatus.io/v2/status/java/${SERVER_IP}:${SERVER_PORT}`);
    return res.json();
  } catch (e) {
    return { online: false };
  }
}

function formatMOTD(motd) {
  if (!motd || !motd.clean) return "No MOTD";
  return motd.clean;
}

async function updateMessage() {
  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    const data = await getStatus();
    
    // បង្កើត String សម្រាប់ប្រៀបធៀប (Status + Players)
    const currentStatusString = JSON.stringify({
      online: data.online,
      players: data.online ? data.players.online : 0,
      version: data.online ? data.version?.name_clean : ""
    });

    // បើទិន្នន័យមិនដូរទេ មិនបាច់ Edit Discord Message នាំជាប់ Rate Limit
    if (lastData === currentStatusString) return;
    lastData = currentStatusString;

    const online = data.online;
    const color = online ? 0x2ecc71 : 0xe74c3c;

    const embed = new EmbedBuilder()
      .setTitle(online ? "🟢 Server Online" : "🔴 Server Offline")
      .setDescription(`**IP:** \`${SERVER_IP}:${SERVER_PORT}\``)
      .addFields(
        { name: "Version", value: online ? data.version?.name_clean || "Unknown" : "Unknown", inline: true },
        { name: "Players", value: online ? `${data.players.online}/${data.players.max}` : "0/0", inline: true },
        { name: "MOTD", value: online ? formatMOTD(data.motd) : "Server offline", inline: false }
      )
      .setColor(color)
      .setFooter({ text: "Last Updated" })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Copy IP")
        .setStyle(ButtonStyle.Primary)
        .setCustomId("copy_server")
    );

    if (!messageId) {
      const msg = await channel.send({ embeds: [embed], components: [row] });
      messageId = msg.id;
    } else {
      const msg = await channel.messages.fetch(messageId);
      await msg.edit({ embeds: [embed], components: [row] });
    }

  } catch (err) {
    console.error("Update Error:", err.message);
  }
}

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;
  if (interaction.customId === "copy_server") {
    await interaction.reply({ content: `${SERVER_IP}:${SERVER_PORT}`, ephemeral: true });
  }
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
  updateMessage();

  setInterval(updateMessage, 15000); 
});

client.login(TOKEN);
