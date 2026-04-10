const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const express = require('express');

// ================= EXPRESS (KEEP RENDER ALIVE) =================
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('🔥 MC Status Bot is running');
});

app.listen(PORT, () => {
    console.log(`🌐 Running on port ${PORT}`);
});

// ================= CONFIG =================
const TOKEN = process.env.TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const SERVER_IP = process.env.SERVER_IP;

// ================= DISCORD CLIENT =================
const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

let lastOnline = null;

// ================= SERVER CHECK =================
async function checkServer() {
    try {
        const res = await axios.get(`https://api.mcsrvstat.us/2/${SERVER_IP}`);
        const data = res.data;

        const online = data.online;
        const players = data.players?.online || 0;

        const channel = await client.channels.fetch(CHANNEL_ID);

        // Only send if status changes
        if (online !== lastOnline) {
            lastOnline = online;

            const embed = new EmbedBuilder()
                .setTitle("📡 Minecraft Server Status")
                .setColor(online ? 0x00ff00 : 0xff0000)
                .setDescription(
                    online
                        ? `🟢 **ONLINE**\n👥 Players: **${players}**`
                        : `🔴 **OFFLINE**`
                )
                .setFooter({ text: "Auto monitored system" })
                .setTimestamp();

            channel.send({ embeds: [embed] });
        }

    } catch (err) {
        console.log("❌ Error:", err.message);
    }
}

// ================= LOOP =================
setInterval(checkServer, 20000);

// ================= START =================
client.once('ready', async () => {
    console.log(`🤖 Logged in as ${client.user.tag}`);

    const channel = await client.channels.fetch(CHANNEL_ID);

    channel.send("🔄 Bot restarted / server monitor active");

    checkServer();
});

client.login(TOKEN);
