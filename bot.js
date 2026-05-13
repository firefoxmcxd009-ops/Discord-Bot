require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// =========================
// 🔥 CONFIG
// =========================
const ip = process.env.SERVER_IP;
const store = process.env.STORE_LINK;

// =========================
// 🧠 LIVE DATA (API READY)
// =========================
const data = {
    port: 25565,        // Minecraft server port (static or API later)
    version: "1.20.4",
    players: 0
};

const maxPlayers = 100;

// =========================
// 🧠 HELPERS
// =========================
function formatDate() {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
}

function mcCaps(text) {
    return text.toUpperCase();
}

// =========================
// 🤖 BOT READY
// =========================
client.once("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
});

// =========================
// 📊 STATUS COMMAND
// =========================
client.on("messageCreate", async (message) => {

    if (message.content === "!status") {

        let msg = await message.channel.send({
            content: "LOADING MINECRAFT STATUS..."
        });

        const update = async () => {

            // 🔄 simulate live players
            data.players = Math.floor(Math.random() * maxPlayers);

            const embed = new EmbedBuilder()
                .setColor(0x3498db) // 🔵 BLUE EMBED
                .setTitle(mcCaps("MINECRAFT SERVER STATUS"))
                .setDescription(mcCaps("LIVE DASHBOARD"))

                .addFields(
                    {
                        name: mcCaps("SERVER IP"),
                        value: `\`${ip}\``,
                        inline: true
                    },
                    {
                        name: mcCaps("PORT"),
                        value: `\`${data.port}\``,
                        inline: true
                    },
                    {
                        name: mcCaps("PLAYERS"),
                        value: `\`${data.players}/${maxPlayers}\``,
                        inline: true
                    },
                    {
                        name: mcCaps("VERSION"),
                        value: `\`${data.version}\``,
                        inline: true
                    },
                    {
                        name: mcCaps("STORE"),
                        value: `[CLICK HERE](${store})`,
                        inline: true
                    },
                    {
                        name: mcCaps("UPDATED"),
                        value: `\`${formatDate()}\``,
                        inline: true
                    }
                )
                .setFooter({ text: "LIVE STATUS • AUTO UPDATE EVERY 5s" });

            // 🔁 EDIT ONLY (NO SPAM)
            await msg.edit({
                content: null,
                embeds: [embed]
            });
        };

        // initial update
        await update();

        // live loop (safe interval)
        setInterval(update, 5000);
    }
});

// =========================
// 🚀 RENDER 24/7 FIX
// =========================
const PORT = process.env.PORT || 3000;
client.login(process.env.BOT_TOKEN);

// keep-alive for Render
require("http")
    .createServer((req, res) => {
        res.write("Bot is alive");
        res.end();
    })
    .listen(PORT);
