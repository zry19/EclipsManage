import 'dotenv/config';
import fs from 'fs';
import pkg from 'discord.js';
const {
  Client,
  GatewayIntentBits,
  IntentsBitField,
  EmbedBuilder,
  Partials,
} = pkg;

// --- FIX: Kompatibilitas semua versi Discord.js ---
const INTENTS =
  GatewayIntentBits?.Guilds
    ? [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ]
    : [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
      ];

const client = new Client({
  intents: INTENTS,
  partials: [Partials.Message, Partials.Channel],
});

// === LOAD CONFIG DARI FILE ===
const CONFIG_PATH = './config.json';
let channels = {
  announcement: null,
  event: null,
  catalog: null,
  rules: null,
  log: null,
};

// Coba load config.json jika ada
if (fs.existsSync(CONFIG_PATH)) {
  try {
    const data = fs.readFileSync(CONFIG_PATH, 'utf8');
    channels = JSON.parse(data);
    console.log('✅ Config loaded:', channels);
  } catch (err) {
    console.error('❌ Gagal load config.json:', err);
  }
}

// === FUNGSI SAVE CONFIG ===
function saveConfig() {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(channels, null, 2));
  console.log('💾 Config saved!');
}

// === BOT READY ===
client.once('ready', () => {
  console.log(`✅ Bot aktif sebagai ${client.user.tag}`);
  client.user.setActivity('Create by @Eclipsera_Team', { type: 3 });
});

// === HANDLE COMMAND ===
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith('!')) return;

  const [cmd, arg] = message.content.slice(1).split(/\s+/);

  // --- SET CHANNEL ---
  if (cmd === 'set') {
    if (!message.member.permissions.has('Administrator'))
      return message.reply('❌ Kamu tidak punya izin untuk ini.');

    if (!arg)
      return message.reply(
        'Gunakan: `!set <announcement|event|catalog|rules|log>` di channel yang diinginkan.'
      );

    if (!channels.hasOwnProperty(arg))
      return message.reply('❌ Jenis channel tidak valid.');

    channels[arg] = message.channel.id;
    saveConfig();
    message.reply(`✅ Channel ${arg} telah diatur ke <#${message.channel.id}>`);
  }

  // --- UNSET CHANNEL ---
  if (cmd === 'unset') {
    if (!message.member.permissions.has('Administrator'))
      return message.reply('❌ Kamu tidak punya izin untuk ini.');

    if (!arg)
      return message.reply(
        'Gunakan: `!unset <announcement|event|catalog|rules|log>`'
      );

    if (!channels.hasOwnProperty(arg))
      return message.reply('❌ Jenis channel tidak valid.');

    channels[arg] = null;
    saveConfig();
    message.reply(`❎ Channel ${arg} telah dihapus dari pengaturan.`);
  }

  // --- HELP MENU ---
  if (cmd === 'help') {
    const embed = new EmbedBuilder()
      .setTitle('📜 Eclipsera Management Bot Help')
      .setDescription(
        [
          'Gunakan perintah berikut untuk mengatur bot:',
          '',
          '`!set <tipe>` → Atur channel (announcement, event, catalog, rules, log)',
          '`!unset <tipe>` → Hapus pengaturan channel',
          '`!create <tipe>` → Kirim pengumuman/event/catalog/rules',
          '',
          '💡 Kamu juga bisa kirim gambar saat `!create`, bot akan otomatis ambil dari attachment.',
        ].join('\n')
      )
      .setColor('#5865F2')
      .setFooter({ text: 'create by @Eclipsera_Team' });
    return message.reply({ embeds: [embed] });
  }

  // --- CREATE CONTENT ---
  if (cmd === 'create') {
    const type = arg;
    if (!['announcement', 'event', 'catalog', 'rules'].includes(type))
      return message.reply('❌ Jenis tidak valid.');

    const target = channels[type];
    if (!target)
      return message.reply(
        `❌ Channel untuk **${type}** belum diatur. Gunakan \`!set ${type}\`.`
      );

    const filter = (m) => m.author.id === message.author.id;
    await message.reply(
      `✍️ Ketik isi untuk **${type}** (bisa kirim teks dan gambar).`
    );

    try {
      const collected = await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 60000,
        errors: ['time'],
      });

      const content = collected.first();
      const text = content.content || '';
      const attachment = content.attachments.first();

      const embed = new EmbedBuilder()
        .setTitle(`📢 ${type.toUpperCase()}`)
        .setDescription(`${text}\n\n‎`) // pakai karakter invisible agar ada spasi
        .setColor('#2B2D31')
        .setFooter({ text: 'create by @Eclipsera_Team' })
        .setTimestamp();

      if (attachment) embed.setImage(attachment.url);

      await message.guild.channels.cache.get(target).send({ embeds: [embed] });
      message.reply(`✅ ${type} telah dikirim ke <#${target}>`);

      // Log message
      if (channels.log) {
        const logEmbed = new EmbedBuilder()
          .setTitle('🧾 Log')
          .setDescription(
            `**${message.author.tag}** membuat **${type}** di <#${target}>`
          )
          .setColor('#808080');
        client.channels.cache.get(channels.log).send({ embeds: [logEmbed] });
      }
    } catch (err) {
      return message.reply('⏰ Waktu habis, buat ulang dengan `!create <tipe>`.');
    }
  }
});

client.login(process.env.TOKEN);
