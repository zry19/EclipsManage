/**
 * 🌙 Eclipsera Management Bot — v7 Final
 * create by @Eclipsera_Team
 */

import pkg from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  PermissionsBitField,
  Events
} = pkg;

// ==== CLIENT SETUP ====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel, Partials.Message],
});

// ==== CONFIG CHANNELS ====
const configPath = './config.json';
let config = {
  announcementChannel: null,
  eventChannel: null,
  catalogChannel: null,
  rulesChannel: null,
  logChannel: null,
};

// Load config jika ada
if (fs.existsSync(configPath)) {
  try {
    config = JSON.parse(fs.readFileSync(configPath));
    console.log('✅ Config loaded');
  } catch {
    console.error('❌ Gagal load config.json');
  }
}

// Save config helper
function saveConfig() {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

// ==== READY / CLIENTREADY ADAPTIVE ====
const readyEventName = Events?.ClientReady || 'clientReady';
client.once(readyEventName, () => {
  console.log(`✅ Bot aktif sebagai ${client.user.tag}`);
  client.user.setActivity('create by @Eclipsera_Team', { type: 3 });

  // Log online ke log channel
  if (config.logChannel) {
    const log = client.channels.cache.get(config.logChannel);
    if (log) log.send({
      embeds: [new EmbedBuilder()
        .setTitle('🟢 Bot Online')
        .setDescription(`Bot berhasil dijalankan pada ${new Date().toLocaleString()}`)
        .setColor('#57F287')
        .setFooter({ text: 'create by @Eclipsera_Team' })
        .setTimestamp()]
    });
  }
});

// ==== COMMAND HANDLER ====
client.on('messageCreate', async (message) => {
  if (!message.content.startsWith('e!') || message.author.bot) return;
  const args = message.content.slice(2).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // --- SET CHANNEL ---
  if (command === 'setchannel') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild))
      return message.reply('❌ Kamu tidak punya izin.');

    const [type] = args;
    const channel = message.mentions.channels.first();
    if (!type || !channel)
      return message.reply('Gunakan: `e!setchannel <type> #channel`');

    if (config.hasOwnProperty(`${type}Channel`)) {
      config[`${type}Channel`] = channel.id;
      saveConfig();
      message.reply(`✅ Channel **${type}** diset ke ${channel}`);

      // Auto backup log
      if (config.logChannel) {
        client.channels.cache.get(config.logChannel)?.send({
          embeds: [new EmbedBuilder()
            .setTitle('⚙️ Config Updated')
            .setDescription(`**${message.author.tag}** mengatur **${type}** ke ${channel}`)
            .addFields({ name: '📁 Config Backup', value: '```json\n' + JSON.stringify(config, null, 2) + '\n```' })
            .setColor('#5865F2')
            .setFooter({ text: 'create by @Eclipsera_Team' })
            .setTimestamp()]
        });
      }
    } else message.reply('❌ Jenis channel tidak valid.');
  }

  // --- UNSET CHANNEL ---
  if (command === 'unsetchannel') {
    const [type] = args;
    if (!type || !config.hasOwnProperty(`${type}Channel`))
      return message.reply('Gunakan: `e!unsetchannel <type>`');

    config[`${type}Channel`] = null;
    saveConfig();
    message.reply(`✅ Channel **${type}** dihapus.`);

    if (config.logChannel) {
      client.channels.cache.get(config.logChannel)?.send({
        embeds: [new EmbedBuilder()
          .setTitle('⚙️ Config Removed')
          .setDescription(`**${message.author.tag}** menghapus pengaturan **${type}**`)
          .addFields({ name: '📁 Config Backup', value: '```json\n' + JSON.stringify(config, null, 2) + '\n```' })
          .setColor('#ED4245')
          .setFooter({ text: 'create by @Eclipsera_Team' })
          .setTimestamp()]
      });
    }
  }

  // --- CREATE EVENT / ANNOUNCEMENT / CATALOG / RULES ---
  if (['createevent','createannouncement','createcatalog','createrules'].includes(command)) {
    const type = command.replace('create','').toLowerCase();
    const filter = (m) => m.author.id === message.author.id;
    
    const ask = async (q) => {
      await message.channel.send(q);
      const collected = await message.channel.awaitMessages({ filter, max: 1, time: 60000 });
      return collected.first()?.content || null;
    };

    const title = await ask('📝 Judul:');
    const description = await ask('📜 Deskripsi (optional):');
    await message.channel.send('📷 Kirim gambar (optional atau ketik skip):');
    const imgMsg = await message.channel.awaitMessages({ filter, max: 1, time: 60000 });
    const image = imgMsg.first()?.attachments.first()?.url || null;

    const embed = new EmbedBuilder()
      .setTitle(title || 'Tanpa Judul')
      .setDescription(description || '*Tidak ada deskripsi*')
      .setColor('#2B2D31')
      .setFooter({ text: 'create by @Eclipsera_Team' })
      .setTimestamp();

    if (image) embed.setImage(image);

    const targetChannel = config[`${type}Channel`] ? message.guild.channels.cache.get(config[`${type}Channel`]) : message.channel;
    targetChannel.send({ embeds: [embed] });

    if (config.logChannel)
      client.channels.cache.get(config.logChannel)?.send({
        embeds: [new EmbedBuilder()
          .setTitle('🧾 Log')
          .setDescription(`**${message.author.tag}** membuat **${type}**`)
          .setColor('#808080')
          .setTimestamp()]
      });
  }

  // --- STATUS ---
  if (command === 'status') {
    message.reply(`✅ Bot aktif sebagai ${client.user.tag}\nVersion: v7 final\nGuilds: ${client.guilds.cache.size}`);
  }

  // --- HELP ---
  if (command === 'help') {
    message.reply({
      embeds: [new EmbedBuilder()
        .setTitle('📘 Eclipsera Bot Help')
        .setDescription([
          '🧩 **Perintah utama:**',
          '`e!setchannel <type> #channel` – Atur channel',
          '`e!unsetchannel <type>` – Hapus channel',
          '`e!create<type>` – Buat konten: event, announcement, catalog, rules',
          '`e!status` – Cek status bot',
          '',
          '💡 Kamu bisa kirim gambar saat create, bot otomatis ambil dari attachment'
        ].join('\n'))
        .setColor('#5865F2')
        .setFooter({ text: 'create by @Eclipsera_Team' })]
    });
  }
});

// ==== LOGIN ====
client.login(process.env.TOKEN);
