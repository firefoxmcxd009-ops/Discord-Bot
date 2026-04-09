// ទាញយក Modules ដែលចាំបាច់
const { Client, GatewayIntentBits, ActivityType, EmbedBuilder } = require('discord.js');
require('dotenv').config();

// បង្កើត Client Instance ជាមួយនឹង Intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// ==================
// HTTP Server សម្រាប់ Keep Alive
// ==================
const express = require('express');
const app = express();

// route ដើម ping
app.get('/', (req, res) => {
    res.send('Bot is running ✅');
});

// Render ផ្តល់ PORT តាម environment variable
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🌐 HTTP server is running on port ${PORT}`);
});

// ==================
// Bot Ready Event
// ==================
client.once('ready', () => {
    console.log(`-----------------------------------------`);
    console.log(`✅ ត្រៀមខ្លួនជាស្រេច! ចូលប្រើដោយ៖ ${client.user.tag}`);
    console.log(`🤖 ID: ${client.user.id}`);
    console.log(`-----------------------------------------`);

    client.user.setActivity('Minecraft Server', { type: ActivityType.Watching });
});

// ==================
// Message Handling
// ==================
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const prefix = "!";
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'ping') {
        const sent = await message.reply('កំពុងត្រួតពិនិត្យ...');
        const latency = sent.createdTimestamp - message.createdTimestamp;
        sent.edit(`🏓 Pong! \n🛰️ ល្បឿនឆ្លើយតប: ${latency}ms \n🌐 API Latency: ${Math.round(client.ws.ping)}ms`);
    }

    if (command === 'info') {
        const infoEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('ព័ត៌មានរបស់ Bot')
            .setDescription('នេះគឺជា Bot សម្រាប់ភ្ជាប់ជាមួយ DiscordSRV និងគ្រប់គ្រង Server។')
            .addFields(
                { name: 'អ្នកបង្កើត', value: 'ឈ្មោះរបស់អ្នក', inline: true },
                { name: 'ជំនាន់', value: '1.0.0', inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'DiscordSRV System' });

        message.channel.send({ embeds: [infoEmbed] });
    }

    if (command === 'clear') {
        const amount = parseInt(args[0]);
        if (isNaN(amount) || amount < 1 || amount > 100) {
            return message.reply('សូមបញ្ចូលចំនួនសារដែលចង់លុប (១ ដល់ ១០០)។');
        }
        
        await message.channel.bulkDelete(amount + 1, true);
        const msg = await message.channel.send(`✅ បានលុបសារចំនួន ${amount} រួចរាល់!`);
        setTimeout(() => msg.delete(), 3000);
    }
});

// ==================
// Login Bot
// ==================
client.login(process.env.DISCORD_TOKEN);
