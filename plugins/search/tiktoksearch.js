const axios = require('axios')

const pluginConfig = {
    name: 'tiktoksearch',
    alias: ['tts', 'searchtiktok'],
    category: 'search',
    description: 'Cari video TikTok',
    usage: '.tiktoksearch <query>',
    example: '.tiktoksearch Nahida',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const query = m.text?.trim()
    
    if (!query) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}tiktoksearch <query>\`\n\n` +
            `> Contoh:\n` +
            `> \`${m.prefix}tts Nahida\``
        )
    }
    
    try {
        const res = await axios.get(`https://api.nekolabs.web.id/dsc/tiktok/search?q=${encodeURIComponent(query)}`)
        
        if (!res.data?.success || !res.data?.result?.length) {
            return m.reply(`❌ Tidak ditemukan hasil untuk: ${query}`)
        }
        
        const videos = res.data.result.slice(0, 5)
        
        let txt = `🎵 *ᴛɪᴋᴛᴏᴋ sᴇᴀʀᴄʜ*\n\n`
        txt += `> Query: *${query}*\n`
        txt += `━━━━━━━━━━━━━━━\n\n`
        
        videos.forEach((v, i) => {
            const title = v.title?.substring(0, 60) || 'TikTok Video'
            txt += `╭─「 🎬 *${i + 1}* 」\n`
            txt += `┃ 📛 \`\`\`${title}${v.title?.length > 60 ? '...' : ''}\`\`\`\n`
            txt += `┃ 👤 \`${v.author?.name || 'Unknown'}\` (${v.author?.username || '-'})\n`
            txt += `┃ ▶️ \`${v.stats?.play || 0}\` • ❤️ \`${v.stats?.like || 0}\`\n`
            txt += `┃ 💬 \`${v.stats?.comment || 0}\` • 🔄 \`${v.stats?.share || 0}\`\n`
            txt += `┃ 🎵 \`${v.music_info?.title || '-'}\`\n`
            txt += `╰━━━━━━━━━━━━━━\n\n`
        })
        
        txt += `> 💡 Download: \`${m.prefix}tiktokdl <url>\``
        
        return m.reply(txt.trim())
        
    } catch (err) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
