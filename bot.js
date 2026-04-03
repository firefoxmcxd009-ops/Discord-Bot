import { Client, GatewayIntentBits, EmbedBuilder } from "discord.js";
import fetch from "node-fetch";
import fs from "fs";

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const TOKEN = "MTQ4OTI3NjQzNjU1OTY5NTkwMg.G6xwtc.Rkq7hYTDkY04X-cPpiaRZzBstffQUUZgiiea1M";
const CHANNEL_ID = "1489274956180230415";
const SERVER_IP = "foxmckingdom.apsara.fun";

// save message id (important)
const FILE = "message.json";

function loadMessageId() {
  if (fs.existsSync(FILE)) {
    const data = JSON.parse(fs.readFileSync(FILE));
    return data.messageId;
  }
  return null;
}

function saveMessageId(id) {
  fs.writeFileSync(FILE, JSON.stringify({ messageId: id }));
}

async function getStatus() {
  const res = await fetch(`https://api.mcsrvstat.us/2/${SERVER_IP}`);
  return res.json();
}

async function updateMessage() {
  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    const data = await getStatus();

    let embed;

    if (data.online) {
      embed = new EmbedBuilder()
        .setTitle("🟢 Minecraft Server Online")
        .setDescription(`**IP:** ${SERVER_IP}`)
        .addFields(
          { name: "👥 Players", value: `${data.players.online}/${data.players.max}`, inline: true },
          { name: "📦 Version", value: `${data.version}`, inline: true }
        )
        .setColor(0x00ff00)
        .setFooter({ text: "Auto Update every 30s" })
        .setTimestamp();
    } else {
      embed = new EmbedBuilder()
        .setTitle("🔴 Minecraft Server Offline")
        .setDescription(`**IP:** ${SERVER_IP}`)
        .setColor(0xff0000)
        .setFooter({ text: "Auto Update every 30s" })
        .setTimestamp();
    }

    let messageId = loadMessageId();

    if (!messageId) {
      // send first message
      const msg = await channel.send({ embeds: [embed] });
      saveMessageId(msg.id);
    } else {
      try {
        const msg = await channel.messages.fetch(messageId);
        await msg.edit({ embeds: [embed] });
      } catch {
        // if message deleted → send new
        const msg = await channel.send({ embeds: [embed] });
        saveMessageId(msg.id);
      }
    }

  } catch (err) {
    console.log(err);
  }
}

client.once("ready", () => {
  console.log(`Bot ready: ${client.user.tag}`);
  updateMessage();
  setInterval(updateMessage, 30000);
});

client.login(TOKEN);