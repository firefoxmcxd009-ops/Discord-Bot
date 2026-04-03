import { Client, GatewayIntentBits, EmbedBuilder } from "discord.js";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const SERVER_IP = process.env.SERVER_IP;

let messageId = null;

async function getStatus() {
  const res = await fetch(`https://api.mcsrvstat.us/2/${SERVER_IP}`);
  return res.json();
}

async function updateMessage() {
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

  if (!messageId) {
    const msg = await channel.send({ embeds: [embed] });
    messageId = msg.id;
  } else {
    const msg = await channel.messages.fetch(messageId);
    await msg.edit({ embeds: [embed] });
  }
}

client.once("ready", () => {
  console.log("Bot Ready");
  updateMessage();
  setInterval(updateMessage, 30000); // update every 30s
});

client.login(TOKEN);
