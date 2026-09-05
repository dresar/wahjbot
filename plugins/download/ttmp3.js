const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: ['ttmp3', 'tiktokmp3', 'ttaudio', 'tiktokmusic'],
    alias: [],
    category: 'download',
    description: 'Download audio/musik dari TikTok',
    usage: '.ttmp3 <url>',
    example: '.ttmp3 https://vt.tiktok.com/xxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    limit: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const url = m.text?.trim()
    
    if (!url) {
        return m.reply(
            `╭┈┈⬡「 🎧 *ᴛɪᴋᴛᴏᴋ ᴀᴜᴅɪᴏ* 」
┃ ㊗ ᴜsᴀɢᴇ: \`${m.prefix}ttmp3 <url>\`
╰┈┈⬡

> \`Contoh: ${m.prefix}ttmp3 https://vt.tiktok.com/xxx\``
        )
    }
    
    if (!url.match(/tiktok\.com|vt\.tiktok/i)) {
        return m.reply(`❌ URL tidak valid. Gunakan link TikTok.`)
    }
    
    m.react('🎧')
    
    try {
        const apiUrl = `https://api.nekolabs.web.id/downloader/tiktok?url=${encodeURIComponent(url)}`
        const { data } = await axios.get(apiUrl, { timeout: 30000 })
        
        if (!data?.success || !data?.result) {
            m.react('❌')
            return m.reply(`❌ Gagal mengambil audio. Coba link lain.`)
        }
        
        const result = data.result
        const audioUrl = result.musicUrl
        
        if (!audioUrl) {
            m.react('❌')
            return m.reply(`❌ Audio/musik tidak ditemukan di video ini.`)
        }
        
        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
        
        await sock.sendMessage(m.chat, {
            audio: { url: audioUrl },
            mimetype: 'audio/mpeg',
            contextInfo: {
                forwardingScore: 9999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: saluranId,
                    newsletterName: saluranName,
                    serverMessageId: 127
                },
                externalAdReply: {
                    title: result.music_info?.title || 'TikTok Audio',
                    body: `${result.music_info?.author || 'Unknown'} • ${result.author?.username || ''}`,
                    mediaType: 2,
                    thumbnailUrl: result.cover,
                    sourceUrl: url
                }
            }
        }, { quoted: m })
        
        m.react('✅')
        
    } catch (err) {
        m.react('❌')
        m.reply(`❌ *ɢᴀɢᴀʟ ᴍᴇɴɢᴜɴᴅᴜʜ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
