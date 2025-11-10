import pkg from "discord.js";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  AttachmentBuilder, 
  PermissionsBitField 
} = pkg;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent, 
    GatewayIntentBits.MessageAttachments
  ],
});

const prefix = "e!";
const configPath = "./config.json";
let config = fs.existsSync(configPath)
  ? JSON.parse(fs.readFileSync(configPath, "utf8"))
  : { announcement: null, event: null, catalog: null, note: null, rules: null };

// ============ LOG FUNCTION ============
async function sendLog(content) {
  try {
    const logChannel = await client.channels.fetch(process.env.LOG_CHANNEL_ID);
    if (logChannel) await logChannel.send(content);
  } catch (err) {
    console.error("❌ Log Error:", err.message);
  }
}

// ============ BACKUP FUNCTION ============
async function sendConfigBackup() {
  try {
    const logChannel = await client.channels.fetch(process.env.LOG_CHANNEL_ID);
    if (!logChannel) return;
    const attachment = new AttachmentBuilder(Buffer.from(JSON.stringify(config, null, 2)), {
      name: "config-backup.json",
    });
    await logChannel.send({ content: "📦 Backup konfigurasi terbaru:", files: [attachment] });
  } catch (err) {
    console.error("❌ Backup Error:", err.message);
  }
}

// ============ READY EVENT ============
client.once("clientReady", () => {
  console.log(`✅ ${client.user.tag} is online!`);
  sendLog(`✅ **${client.user.tag}** berhasil online di server.`);
});

// ============ COMMAND HANDLER ============
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.startsWith(prefix)) return;
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // SETUP CHANNEL
  if (command === "setup") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply("❌ Kamu butuh izin **Administrator** untuk menggunakan perintah ini.");

    const type = args[0];
    const channel = message.mentions.channels.first();

    if (!type || !channel)
      return message.reply("Gunakan format: `e!setup <announcement|event|catalog|note|rules> <#channel>`");

    if (!config.hasOwnProperty(type))
      return message.reply("❌ Jenis setup tidak valid!");

    config[type] = channel.id;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    sendLog(`🛠️ **${type}** diatur ke <#${channel.id}> oleh ${message.author.tag}`);
    sendConfigBackup();
    return message.reply(`✅ Channel untuk **${type}** berhasil diatur ke ${channel}.`);
  }

  // UNSET CHANNEL
  if (command === "unset") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply("❌ Kamu butuh izin **Administrator** untuk menggunakan perintah ini.");

    const type = args[0];
    if (!type || !config[type]) return message.reply("Gunakan format: `e!unset <announcement|event|catalog|note|rules>`");

    config[type] = null;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    sendLog(`⚠️ **${type}** channel dihapus oleh ${message.author.tag}`);
    sendConfigBackup();
    return message.reply(`✅ Channel untuk **${type}** telah dihapus.`);
  }

  // CREATE EMBED (GENERAL)
  if (command === "create") {
    const type = args[0];
    if (!type) return message.reply("Gunakan format: `e!create <announcement|event|catalog|note|rules>`");

    const channelId = config[type];
    if (!channelId) return message.reply(`⚠️ Channel untuk **${type}** belum diset!`);

    const target = await message.guild.channels.fetch(channelId);

    // MEDIA HANDLING (AMBIL DARI GALERI)
    const attachment = message.attachments.first();
    const imageURL = attachment ? attachment.url : null;

    const colorMap = {
      announcement: "#5865F2",
      event: "#57F287",
      catalog: "#EB459E",
      note: "#FEE75C",
      rules: "#ED4245",
    };

    const titleMap = {
      announcement: "📢 ･ﾟ *Announcement Baru*",
      event: "🎊 ･ﾟ *Event Baru!*",
      catalog: "🛍️ ･ﾟ *Produk Baru Ditambahkan!*",
      note: "📝 ･ﾟ *Catatan Baru*",
      rules: "⚖️ ･ﾟ *Peraturan Server*",
    };

    const embed = new EmbedBuilder()
      .setColor(colorMap[type] || "#FFFFFF")
      .setTitle(titleMap[type] || "📌 Informasi")
      .setDescription(
        [
          "‎",
          "✨ **Judul:** _(Opsional)_",
          "💬 **Deskripsi:** _(Isi pesan kamu di sini dengan gaya rapi)_",
          "",
          "> *Kamu juga bisa melampirkan gambar langsung dari galeri/device saat membuat pesan.*",
          "",
          "╰───★────────────────────★───╯",
          "",
        ].join("\n")
      )
      .setFooter({ text: "create by @Eclipsera_Team", iconURL: client.user.displayAvatarURL() })
      .setTimestamp();

    if (imageURL) embed.setImage(imageURL);

    await target.send({ embeds: [embed] });
    sendLog(`🪶 ${type} dibuat oleh ${message.author.tag}`);
    return message.reply(`✅ ${type} berhasil dikirim!`);
  }
});

client.login(process.env.TOKEN);
