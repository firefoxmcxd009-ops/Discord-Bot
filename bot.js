const { Client, GatewayIntentBits, ActivityType, EmbedBuilder } = require('discord.js');
const express = require('express'); // បន្ថែម express
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// --- ផ្នែកបន្ថែមសម្រាប់ RENDER (Port Handling) ---
const app = express();
const PORT = process.env.PORT || 3000; // Render នឹងផ្តល់ Port ឱ្យអូតូ

app.get('/', (req, res) => {
    res.send('Bot is Online! 🚀');
});

app.listen(PORT, () => {
    console.log(`📡 Server is running on port ${PORT}`);
});
// ------------------------------------------

client.once('ready', () => {
    console.log(`-----------------------------------------`);
    console.log(`✅ ត្រៀមខ្លួនជាស្រេច! ចូលប្រើដោយ៖ ${client.user.tag}`);
    client.user.setActivity('24/7 on Render', { type: ActivityType.Watching });
});

// Message Handling
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const prefix = "!";
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'ping') {
        message.reply('🏓 Pong!');
    }
});

client.login(process.env.DISCORD_TOKEN);
