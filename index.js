/**
 * 🌙 Eclipsera Management Bot — v3.3.5 Final
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

if (fs.existsSync(configPath)) {
  try { config = JSON.parse(fs.readFileSync(configPath)); } 
  catch { console.error('❌ Gagal load config.json'); }
}

function saveConfig() {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

// ==== READY / CLIENTREADY ADAPTIVE ====
const readyEventName = Events?.ClientReady || 'clientReady';
client.once(readyEventName, () => {
  console.log(`✅ Bot aktif sebagai ${client.user.tag}`);
  client.user.setActivity('create by @Eclipsera_Team', { type: 3 });

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
  if (!message.content.startsWith('m1') || message.author.bot) return;
  const args = message.content.slice(2).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // ==== DYNAMIC SET / UNSET PER CHANNEL ====
  const channelTypes = ['log','event','announcement','catalog','rules'];

  for (const type of channelTypes) {
    if (command === `set${type}`) {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild))
        return message.reply('❌ Kamu tidak punya izin.');

      const channel = message.mentions.channels.first();
      if (!channel) return message.reply(`Gunakan: m1set${type} #channel`);

      config[`${type}Channel`] = channel.id;
      saveConfig();
      message.reply(`✅ Channel **${type}** diset ke ${channel}`);

      if (config.logChannel) {
        client.channels.cache.get(config.logChannel)?.send({
          embeds: [new EmbedBuilder()
            .setTitle('⚙️ Config Updated')
            .setDescription(`**${message.author.tag}** mengatur **${type}** ke ${channel}`)
            .setColor('#5865F2')
            .setFooter({ text: 'create by @Eclipsera_Team' })
            .setTimestamp()]
        });
      }
    }

    if (command === `unset${type}`) {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild))
        return message.reply('❌ Kamu tidak punya izin.');

      config[`${type}Channel`] = null;
      saveConfig();
      message.reply(`✅ Channel **${type}** dihapus.`);

      if (config.logChannel) {
        client.channels.cache.get(config.logChannel)?.send({
          embeds: [new EmbedBuilder()
            .setTitle('⚙️ Config Removed')
            .setDescription(`**${message.author.tag}** menghapus channel **${type}**`)
            .setColor('#ED4245')
            .setFooter({ text: 'create by @Eclipsera_Team' })
            .setTimestamp()]
        });
      }
    }
  }

  // ==== CREATE CONTENT ====
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

  // ==== STATUS & HELP ====
  if (command === 'status') {
    message.reply(`✅ Bot aktif sebagai ${client.user.tag}\nVersion: v3.3.5 final\nGuilds: ${client.guilds.cache.size}`);
  }

  if (command === 'help') {
    const embed = new EmbedBuilder()
      .setTitle('📘 Eclipsera Bot Help')
      .setColor('#5865F2')
      .setFooter({ text: 'create by @Eclipsera_Team' })
      .addFields(
        { name: '🧩 Channel Management', value:
          '`m1setlog` / `m1unsetlog`\n' +
          '`m1setevent` / `m1unsetevent`\n' +
          '`m1setannouncement` / `m1unsetannouncement`\n' +
          '`m1setcatalog` / `m1unsetcatalog`\n' +
          '`m1setrules` / `m1unsetrules`', inline: false
        },
        { name: '📝 Create Content', value:
          '`m1createevent` – Buat Event\n' +
          '`m1createannouncement` – Buat Pengumuman\n' +
          '`m1createcatalog` – Buat Catalog / Produk\n' +
          '`m1createrules` – Buat Rules / Note', inline: false
        },
        { name: 'ℹ️ Info', value: '`m1status` – Cek bot aktif\n💡 Upload gambar bisa lewat attachment', inline: false }
      );
    message.reply({ embeds: [embed] });
  }
});

// ==== LOGIN ====
client.login(process.env.TOKEN);
