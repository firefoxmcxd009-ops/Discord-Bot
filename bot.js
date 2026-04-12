const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const express = require('express');

// =================== PORT ===================
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('✔ MC Status Bot is running');
});

app.listen(PORT, () => {
    console.log(`✔ Running on port ${PORT}`);
});

// ================= CONFIG ===================
const TOKEN = process.env.TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const SERVER_IP = process.env.SERVER_IP;

// ================= DISCORD CLIENT ===================
const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

let lastOnline = null;

// ================= SERVER CHECK ===================
async function checkServer() {
    try {
        const res = await axios.get(`https://api.mcsrvstat.us/2/${SERVER_IP}`);
        const data = res.data;

        const port = data.port ?? "25565";
        const online = data.online;
        const players = data.players?.online ?? 0;
        const playermax = data.players?.max ?? 0;
        const version = data.version || "Unknown";

        const channel = await client.channels.fetch(CHANNEL_ID).catch(() => null);
        if (!channel) return;

        // Send only when status changes
        if (online !== lastOnline) {
            lastOnline = online;

            const statusEmbed = new EmbedBuilder()
                .setTitle("⮞ Status Bot")
                .setColor(online ? 0x00ff00 : 0xff0000)
                .setDescription(
                    online
                        ? `**⭯ Server Online**\n✷ Server បានបើកវិញហើយ! អរគុណសម្រាប់ការរងចាំ ♥\n\n⮎ IP: **${SERVER_IP}**\n✦ Port: **${port}**\n✈ Players: **${players}/${playermax}**\n❖ Version: **${version}**\n✉ Join ឆានែលតេលេក្រាម: **[foxmckingdom channel](https://t.me/foxmckingdom)** here.`
                        : `**⭮ Server Offline**\n☘ Server ត្រូវបានបិទ ឬ Restart\n★ ដើម្បី update and reload plugins មួយចំនួន. Thanks for waiting!\n✉ Join ឆានែលតេលេក្រាម: **[foxmckingdom channel](https://t.me/foxmckingdom)** here.`
                )
                .setFooter({ text: "Monitored system | Coding/Created by: ♥ Foxmckingdom" })
                .setTimestamp();

            await channel.send({ embeds: [statusEmbed] });
        }

    } catch (err) {
        console.log("☹ Error:", err.message);
    }
}

// ================= LOOP ===================
setInterval(checkServer, 20000);

// ================= START ===================
client.once('ready', async () => {
    console.log(`❱❱ Logged in as ${client.user.tag}`);

    const channel = await client.channels.fetch(CHANNEL_ID).catch(() => null);

    if (channel) {
        // Blue embed for bot restart / active monitor
        const restartEmbed = new EmbedBuilder()
            .setTitle("⮞ Status Bot")
            .setColor(0x0099ff) // Blue
            .setDescription(
                `**⭮ Bot Restarted / Server Monitor Active ☻**\n` +
                `✔ Bot បានចាប់ផ្តើមឡើងវិញដោយជោគជ័យ\n` +
                `☘ កំពុងតាមដានស្ថានភាព Server រៀងរាល់ 20 វិនាទី\n\n` +
                `⮎ IP: **${SERVER_IP}**\n` +
                `✉ Join ឆានែលតេលេក្រាម: **[foxmckingdom channel](https://t.me/foxmckingdom)** here.`
            )
            .setFooter({ text: "Monitored system | Coding/Created by: ♥ Foxmckingdom" })
            .setTimestamp();

        await channel.send({ embeds: [restartEmbed] });
    }

    checkServer();
});

client.login(TOKEN);
