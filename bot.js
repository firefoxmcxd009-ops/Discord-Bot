// ទាញយក Modules ដែលចាំបាច់
const { Client, GatewayIntentBits, ActivityType, EmbedBuilder } = require('discord.js');
require('dotenv').config();

// បង្កើត Client Instance ជាមួយនឹង Intents (ការអនុញ្ញាតទាញយកទិន្នន័យ)
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,           // សម្រាប់ទិន្នន័យ Server
        GatewayIntentBits.GuildMessages,    // សម្រាប់ទទួលបានសារ
        GatewayIntentBits.MessageContent,   // សម្រាប់អានខ្លឹមសារសារ (សំខាន់!)
        GatewayIntentBits.GuildMembers      // សម្រាប់ទិន្នន័យសមាជិក
    ]
});

// ព្រឹត្តិការណ៍នៅពេល Bot ចាប់ផ្តើមដំណើរការ (Online)
client.once('ready', () => {
    console.log(`-----------------------------------------`);
    console.log(`✅ ត្រៀមខ្លួនជាស្រេច! ចូលប្រើដោយ៖ ${client.user.tag}`);
    console.log(`🤖 ID: ${client.user.id}`);
    console.log(`-----------------------------------------`);

    // កំណត់ស្ថានភាព Bot (Status)
    client.user.setActivity('Minecraft Server', { type: ActivityType.Watching });
});

// ការចាប់យកសារ និងឆ្លើយតប (Message Handling)
client.on('messageCreate', async (message) => {
    // បញ្ឈប់ Bot កុំឱ្យឆ្លើយតបសាររបស់ Bot ខ្លួនឯង ឬ Bot ដទៃ
    if (message.author.bot) return;

    // បំបែកពាក្យបញ្ជា (Prefix: !)
    const prefix = "!";
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // បញ្ជាទី១: !ping
    if (command === 'ping') {
        const sent = await message.reply('កំពុងត្រួតពិនិត្យ...');
        const latency = sent.createdTimestamp - message.createdTimestamp;
        sent.edit(`🏓 Pong! \n🛰️ ល្បឿនឆ្លើយតប: ${latency}ms \n🌐 API Latency: ${Math.round(client.ws.ping)}ms`);
    }

    // បញ្ជាទី២: !info (បង្ហាញព័ត៌មានជាទម្រង់ Embed)
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

    // បញ្ជាទី៣: !clear (លុបសារ)
    if (command === 'clear') {
        const amount = parseInt(args[0]);
        if (isNaN(amount) || amount < 1 || amount > 100) {
            return message.reply('សូមបញ្ចូលចំនួនសារដែលចង់លុប (១ ដល់ ១០០)។');
        }
        
        await message.channel.bulkDelete(amount + 1, true);
        const msg = await message.channel.send(`✅ បានលុបសារចំនួន ${amount} រួចរាល់!`);
        setTimeout(() => msg.delete(), 3000); // លុបសារប្រាប់ដំណឹងវិញក្រោយ ៣ វិនាទី
    }
});

// ភ្ជាប់ Bot ទៅកាន់ Discord ដោយប្រើ Token ពី .env
client.login(process.env.DISCORD_TOKEN);
