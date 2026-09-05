const FormData = require('form-data');
const fetch = require('node-fetch');
const fs = require('fs');
const { downloadMediaMessage, getContentType } = require('ourin');

const pluginConfig = {
    name: 'tourl',
    alias: ['upload', 'catbox', 'url'],
    category: 'tools',
    description: 'Upload media ke Catbox dan dapatkan URL',
    usage: '.tourl (reply/kirim media)',
    example: '.tourl',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    limit: 1,
    isEnabled: true
};

async function uploadToCatbox(buffer, filename) {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', buffer, {
        filename: filename,
        contentType: 'application/octet-stream'
    });
    
    const response = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        body: form
    });
    
    if (!response.ok) {
        throw new Error('Upload gagal');
    }
    
    return await response.text();
}

function getFileExtension(mimetype) {
    const mimeMap = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'video/mp4': 'mp4',
        'video/3gpp': '3gp',
        'video/quicktime': 'mov',
        'audio/mpeg': 'mp3',
        'audio/ogg': 'ogg',
        'audio/wav': 'wav',
        'audio/mp4': 'm4a',
        'application/pdf': 'pdf',
        'application/zip': 'zip'
    };
    return mimeMap[mimetype] || 'bin';
}

async function handler(m, { sock }) {
    let media = null;
    let mimetype = null;
    let filename = 'file';
    
    if (m.quoted && m.quoted.message) {
        const quotedMsg = m.quoted.message;
        const type = getContentType(quotedMsg);
        
        if (!type || type === 'conversation' || type === 'extendedTextMessage') {
            await m.reply(
                `⚠️ *ᴠᴀʟɪᴅᴀsɪ ɢᴀɢᴀʟ*\n\n` +
                `> Pesan yang di-reply bukan media!\n` +
                `> Reply \`gambar\`, \`video\`, atau \`audio\`.`
            );
            return;
        }
        
        try {
            media = await downloadMediaMessage(
                { key: m.quoted.key, message: quotedMsg },
                'buffer',
                {}
            );
            
            const content = quotedMsg[type];
            mimetype = content?.mimetype || 'application/octet-stream';
            filename = content?.fileName || `file.${getFileExtension(mimetype)}`;
        } catch (error) {
            await m.reply(
                `❌ *ᴇʀʀᴏʀ*\n\n` +
                `> Gagal mengunduh media.\n` +
                `> _${error.message}_`
            );
            return;
        }
    } else if (m.message) {
        const type = getContentType(m.message);
        
        if (!type || type === 'conversation' || type === 'extendedTextMessage') {
            await m.reply(
                `⚠️ *ᴠᴀʟɪᴅᴀsɪ ɢᴀɢᴀʟ*\n\n` +
                `> Tidak ada media yang ditemukan!\n\n` +
                `*Cara penggunaan:*\n` +
                `> 1. Kirim media + caption \`.tourl\`\n` +
                `> 2. Reply media dengan \`.tourl\``
            );
            return;
        }
        
        try {
            media = await downloadMediaMessage(
                { key: m.key, message: m.message },
                'buffer',
                {}
            );
            
            const content = m.message[type];
            mimetype = content?.mimetype || 'application/octet-stream';
            filename = content?.fileName || `file.${getFileExtension(mimetype)}`;
        } catch (error) {
            await m.reply(
                `❌ *ᴇʀʀᴏʀ*\n\n` +
                `> Gagal mengunduh media.\n` +
                `> _${error.message}_`
            );
            return;
        }
    }
    
    if (!media || media.length === 0) {
        await m.reply(
            `⚠️ *ᴠᴀʟɪᴅᴀsɪ ɢᴀɢᴀʟ*\n\n` +
            `> Media tidak ditemukan atau kosong!`
        );
        return;
    }
    
    await m.reply(
        `⏳ *ᴍᴇɴɢᴜᴘʟᴏᴀᴅ...*\n\n` +
        `> Mengupload ke Catbox...\n` +
        `> Ukuran: \`${(media.length / 1024 / 1024).toFixed(2)} MB\``
    );
    
    try {
        const url = await uploadToCatbox(media, filename);
        
        if (!url || !url.startsWith('http')) {
            throw new Error('Response tidak valid dari Catbox');
        }
        
        const fileType = mimetype.split('/')[0];
        
        const caption = `📤 *ᴜᴘʟᴏᴀᴅ ʙᴇʀʜᴀsɪʟ*

╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」
┃ ㊗ 📡 sᴛᴀᴛᴜs: *🟢 Berhasil*
┃ ㊗ 🌐 ʜᴏsᴛ: *catbox.moe*
┃ ㊗ 📁 ᴛɪᴘᴇ: *${fileType}*
┃ ㊗ 📦 sɪᴢᴇ: *${(media.length / 1024 / 1024).toFixed(2)} MB*
╰┈┈⬡

> _Klik tombol di bawah untuk copy URL._
> _URL berlaku selamanya._`;

        let thumbnail = null;
        try {
            if (fs.existsSync('./assets/images/ourin2.jpg')) {
                thumbnail = fs.readFileSync('./assets/images/ourin2.jpg');
            }
        } catch (e) {}

        await sock.sendMessage(m.chat, {
            text: caption,
            title: '📤 Upload Berhasil',
            footer: 'Powered by Catbox.moe',
            contextInfo: {
                externalAdReply: {
                    title: '📤 File Uploaded!',
                    body: url,
                    thumbnail: thumbnail,
                    sourceUrl: url,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            },
            interactiveButtons: [
                {
                    name: 'cta_copy',
                    buttonParamsJson: JSON.stringify({
                        display_text: '📋 Copy URL',
                        copy_code: url
                    })
                },
                {
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: '🌐 Buka URL',
                        url: url
                    })
                }
            ]
        }, { quoted: m });
        
    } catch (error) {
        await m.reply(
            `❌ *ᴇʀʀᴏʀ*\n\n` +
            `> Gagal upload ke Catbox.\n` +
            `> _${error.message}_\n\n` +
            `> _Coba lagi nanti atau gunakan_\n` +
            `> _media dengan ukuran lebih kecil._`
        );
    }
}

module.exports = {
    config: pluginConfig,
    handler
};
