// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Eclipsera Bot v9 - Smart Prompt System (CommonJS version)
// by @Eclipsera_Team
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

require("dotenv").config();
const fs = require("fs");
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
} = require("discord.js");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Konfigurasi awal
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const configPath = "./config.json";
let config = { prefix: "e!", logChannelId: null };
if (fs.existsSync(configPath)) {
  config = JSON.parse(fs.readFileSync(configPath, "utf8"));
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Fungsi bantu: prompt interaktif
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function askQuestion(channel, user, question, optional = false) {
  await channel.send(question + (optional ? " (opsional — tekan Enter untuk skip)" : ""));
  const collected = await channel.awaitMessages({
    filter: (m) => m.author.id === user.id,
    max: 1,
    time: 60000,
  });
  const response = collected.first();
  if (!response) return null;
  if (optional && response.content.trim() === "") return null;
  return response;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Saat bot aktif
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
client.once("ready", () => {
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━
🪩 Eclipsera Bot Online!
✅ Status: Aktif & Siap Digunakan
⚙️ Prefix: e!
・create by @Eclipsera_Team
━━━━━━━━━━━━━━━━━━━━━━━
  `);

  if (config.logChannelId) {
    const logChannel = client.channels.cache.get(config.logChannelId);
    if (logChannel) {
      const embed = new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle("🌙 Eclipsera Bot Siap!")
        .setDescription("Bot telah berhasil aktif dan siap menerima perintah.")
        .setFooter({ text: "・create by @Eclipsera_Team" });
      logChannel.send({ embeds: [embed] });
    }
  }

  client.user.setPresence({
    activities: [{ name: "e!help | Eclipsera System", type: 2 }],
    status: "online",
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Command handler utama
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.startsWith(config.prefix)) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/);
  const command = args.shift()?.toLowerCase();

  // Fungsi kirim log
  const sendLog = async (embed) => {
    if (config.logChannelId) {
      const logChannel = client.channels.cache.get(config.logChannelId);
      if (logChannel) logChannel.send({ embeds: [embed] });
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // e!setlog / e!unsetlog
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (command === "setlog") {
    config.logChannelId = message.channel.id;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    const embed = new EmbedBuilder()
      .setColor("#57F287")
      .setTitle("✅ Log Channel Diset!")
      .setDescription(`Channel ini (${message.channel}) telah dijadikan log channel.`)
      .setFooter({ text: "・create by @Eclipsera_Team" });
    return message.channel.send({ embeds: [embed] });
  }

  if (command === "unsetlog") {
    config.logChannelId = null;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    const embed = new EmbedBuilder()
      .setColor("#ED4245")
      .setTitle("🧾 Log Channel Dihapus!")
      .setDescription("Log channel telah dihapus dari konfigurasi.")
      .setFooter({ text: "・create by @Eclipsera_Team" });
    return message.channel.send({ embeds: [embed] });
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // e!createevent
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (command === "createevent") {
    const user = message.author;
    const channel = message.channel;
    await channel.send("🪄 Ayo buat event baru!");

    const titleMsg = await askQuestion(channel, user, "📌 Judul event:");
    if (!titleMsg) return channel.send("❌ Pembuatan event dibatalkan (tidak ada judul).");

    const descMsg = await askQuestion(channel, user, "📝 Deskripsi event:", true);
    const dateMsg = await askQuestion(channel, user, "📅 Tanggal event:", true);
    const timeMsg = await askQuestion(channel, user, "⏰ Waktu event:", true);

    const embed = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle(`🎉 ${titleMsg.content}`)
      .setFooter({ text: "・create by @Eclipsera_Team" });

    if (descMsg) embed.addFields({ name: "📝 Deskripsi", value: descMsg.content });
    if (dateMsg) embed.addFields({ name: "📅 Tanggal", value: dateMsg.content });
    if (timeMsg) embed.addFields({ name: "⏰ Waktu", value: timeMsg.content });

    await channel.send({ embeds: [embed] });
    await sendLog(embed);
    return;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // e!announce
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (command === "announce") {
    const user = message.author;
    const channel = message.channel;
    await channel.send("📢 Buat pengumuman baru!");

    const titleMsg = await askQuestion(channel, user, "📰 Judul pengumuman:");
    if (!titleMsg) return channel.send("❌ Pengumuman dibatalkan (tidak ada judul).");

    const descMsg = await askQuestion(channel, user, "📄 Isi pengumuman:", true);
    const attachment = message.attachments.first() || null;

    const embed = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle(`📢 ${titleMsg.content}`)
      .setFooter({ text: "・create by @Eclipsera_Team" });

    if (descMsg) embed.setDescription(descMsg.content);
    if (attachment) embed.setImage(attachment.url);

    await channel.send({ embeds: [embed] });
    await sendLog(embed);
    return;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // e!note
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (command === "note") {
    const titleMsg = await askQuestion(message.channel, message.author, "🗒️ Judul catatan:");
    if (!titleMsg) return;
    const descMsg = await askQuestion(message.channel, message.author, "💬 Isi catatan:", true);

    const embed = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle(`🗒️ ${titleMsg.content}`)
      .setFooter({ text: "・create by @Eclipsera_Team" });

    if (descMsg) embed.setDescription(descMsg.content);

    await message.channel.send({ embeds: [embed] });
    await sendLog(embed);
    return;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // e!rules
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (command === "rules") {
    const titleMsg = await askQuestion(message.channel, message.author, "📘 Judul aturan:");
    const descMsg = await askQuestion(message.channel, message.author, "📜 Isi aturan:", true);

    const embed = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle(`📘 ${titleMsg.content}`)
      .setFooter({ text: "・create by @Eclipsera_Team" });

    if (descMsg) embed.setDescription(descMsg.content);

    await message.channel.send({ embeds: [embed] });
    await sendLog(embed);
    return;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // e!addproduct (catalog)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (command === "addproduct") {
    const nameMsg = await askQuestion(message.channel, message.author, "🛍️ Nama produk:");
    if (!nameMsg) return;
    const descMsg = await askQuestion(message.channel, message.author, "🧾 Deskripsi produk:", true);
    const priceMsg = await askQuestion(message.channel, message.author, "💰 Harga produk:", true);
    const attachment = message.attachments.first() || null;

    const embed = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle(`🛒 ${nameMsg.content}`)
      .setFooter({ text: "・create by @Eclipsera_Team" });

    if (descMsg) embed.addFields({ name: "🧾 Deskripsi", value: descMsg.content });
    if (priceMsg) embed.addFields({ name: "💰 Harga", value: priceMsg.content });
    if (attachment) embed.setImage(attachment.url);

    await message.channel.send({ embeds: [embed] });
    await sendLog(embed);
    return;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // e!ping
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (command === "ping") {
    const ping = Date.now() - message.createdTimestamp;
    return message.reply(`🏓 Pong! ${ping}ms`);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // e!help
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (command === "help") {
    const embed = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle("🪩 Eclipsera Command List")
      .setDescription(`
**${config.prefix}createevent** - Buat event baru  
**${config.prefix}announce** - Buat pengumuman  
**${config.prefix}note** - Buat catatan  
**${config.prefix}rules** - Buat aturan  
**${config.prefix}addproduct** - Tambah produk ke katalog  
**${config.prefix}setlog / unsetlog** - Atur channel log  
**${config.prefix}ping** - Cek kecepatan bot
      `)
      .setFooter({ text: "・create by @Eclipsera_Team" });
    return message.channel.send({ embeds: [embed] });
  }
});

client.login(process.env.TOKEN);
