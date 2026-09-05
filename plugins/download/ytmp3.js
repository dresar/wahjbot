const SaveTubeClient = require('../../src/scraper/youtube')

const pluginConfig = {
    name: 'ytmp3',
    alias: ['ytaudio', 'youtubemp3'],
    category: 'download',
    description: 'Download audio YouTube MP3',
    usage: '.ytmp3 <url>',
    example: '.ytmp3 https://youtu.be/xxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    limit: 1,
    isEnabled: true
}

if (!global.ytdlSessions) {
    global.ytdlSessions = new Map()
}

function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

async function handler(m, { sock }) {
    const url = m.text?.trim()
    
    if (!url) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}ytmp3 <url>\`\n\n` +
            `> Contoh:\n` +
            `> \`${m.prefix}ytmp3 https://youtu.be/xxx\``
        )
    }
    
    if (!url.match(/youtu\.?be/i)) {
        return m.reply(`❌ URL tidak valid. Gunakan link YouTube.`)
    }
    
    await m.reply(`⏳ *ᴍᴇɴɢᴀᴍʙɪʟ ɪɴꜰᴏ ᴠɪᴅᴇᴏ...*`)
    
    try {
        const api = new SaveTubeClient()
        const info = await api.getVideoInfo(url)
        
        if (info.error || !info.key) {
            return m.reply(`❌ Gagal mengambil info video. Coba link lain.`)
        }
        
        await m.reply(`⏳ *ᴍᴇɴɢᴜɴᴅᴜʜ ᴀᴜᴅɪᴏ...*\n\n> 📛 ${info.title}`)
        
        const download = await api.getDownload(info.key, 'audio', 128)
        
        if (!download?.downloadUrl) {
            return m.reply(`❌ Gagal mendapatkan link download.`)
        }
        
        await sock.sendMessage(m.chat, {
            audio: { url: download.downloadUrl },
            mimetype: 'audio/mpeg',
            fileName: `${info.title}.mp3`
        }, { quoted: m })
        
    } catch (err) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
