const tiktokDl = require('../../src/scraper/tiktok')
const config = require('../../config')

const pluginConfig = {
    name: ['tiktok', 'tt', 'ttmp4'],
    alias: ['tiktokdl', 'ttdown'],
    category: 'download',
    description: 'Download video TikTok tanpa watermark',
    usage: '.tiktok <url>',
    example: '.tiktok https://vt.tiktok.com/xxx',
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
            `╭┈┈⬡「 🎵 *ᴛɪᴋᴛᴏᴋ ᴅᴏᴡɴʟᴏᴀᴅ* 」
┃ ㊗ ᴜsᴀɢᴇ: \`${m.prefix}tiktok <url>\`
╰┈┈⬡

> \`Contoh: ${m.prefix}tiktok https://vt.tiktok.com/xxx\``
        )
    }
    
    if (!url.match(/tiktok\.com|vt\.tiktok/i)) {
        return m.reply(`❌ URL tidak valid. Gunakan link TikTok.`)
    }
    
    m.react('🎵')
    await m.reply(`⏳ *ᴍᴇɴɢᴜɴᴅᴜʜ ᴠɪᴅᴇᴏ...*`)
    
    try {
        const result = await tiktokDl(url)
        
        console.log('[TikTokDL] Result status:', result?.status)
        console.log('[TikTokDL] Result data:', result?.data?.length)
        
        if (!result?.status) {
            m.react('❌')
            return m.reply(`❌ Gagal mengambil video. ${result?.error || 'Coba link lain.'}`)
        }
        
        const isSlideshow = result.data.some(d => d.type === 'photo')
        
        if (isSlideshow) {
            const photos = result.data.filter(d => d.type === 'photo')
            console.log('[TikTokDL] Slideshow photos:', photos.length)
            
            for (let i = 0; i < Math.min(photos.length, 10); i++) {
                await sock.sendMessage(m.chat, {
                    image: { url: photos[i].url },
                    caption: i === 0 ? `╭┈┈⬡「 🖼️ *ᴛɪᴋᴛᴏᴋ sʟɪᴅᴇsʜᴏᴡ* 」
┃ ㊗ ᴛɪᴛʟᴇ: ${result.title?.substring(0, 50) || 'No Title'}
┃ ㊗ ᴀᴜᴛʜᴏʀ: @${result.author.fullname}
┃ ㊗ ᴛᴏᴛᴀʟ: ${photos.length} gambar
╰┈┈⬡` : ''
                }, { quoted: m })
            }
            m.react('✅')
            return
        }
        
        let videoUrl = result.data.find(d => d.type === 'nowatermark_hd' && d.url)?.url 
            || result.data.find(d => d.type === 'nowatermark' && d.url)?.url
            || result.data.find(d => d.type === 'watermark' && d.url)?.url
        
        console.log('[TikTokDL] Video URL:', videoUrl)
        
        if (!videoUrl || videoUrl === 'https://www.tikwm.com') {
            m.react('❌')
            return m.reply(`❌ Video tidak ditemukan. URL tidak valid.`)
        }
        
        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
        
        const caption = `╭┈┈⬡「 🎵 *ᴛɪᴋᴛᴏᴋ ᴅᴏᴡɴʟᴏᴀᴅ* 」
┃ 📝 *${result.title?.substring(0, 80) || 'No Title'}*
╰┈┈⬡

╭┈┈⬡「 👤 *ᴀᴜᴛʜᴏʀ* 」
┃ ㊗ ᴜsᴇʀɴᴀᴍᴇ: @${result.author.fullname}
┃ ㊗ ɴɪᴄᴋɴᴀᴍᴇ: ${result.author.nickname}
╰┈┈⬡

╭┈┈⬡「 🎶 *ᴍᴜsɪᴄ* 」
┃ ㊗ ᴛɪᴛʟᴇ: ${result.music_info.title || '-'}
┃ ㊗ ᴀʀᴛɪsᴛ: ${result.music_info.author || '-'}
╰┈┈⬡

╭┈┈⬡「 📊 *sᴛᴀᴛs* 」
┃ ▶️ ᴠɪᴇᴡs: ${result.stats.views}
┃ ❤️ ʟɪᴋᴇs: ${result.stats.likes}
┃ 💬 ᴄᴏᴍᴍᴇɴᴛs: ${result.stats.comment}
┃ 🔗 sʜᴀʀᴇs: ${result.stats.share}
╰┈┈⬡

> ⏱️ ᴅᴜʀᴀᴛɪᴏɴ: \`${result.duration}\`
> 🎧 ᴛɪᴘs: \`${m.prefix}ttmp3 <url>\` untuk audio`
        
        await sock.sendMessage(m.chat, {
            video: { url: videoUrl },
            caption: caption,
            contextInfo: {
                forwardingScore: 9999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: saluranId,
                    newsletterName: saluranName,
                    serverMessageId: 127
                }
            }
        }, { quoted: m })
        
        m.react('✅')
        
    } catch (err) {
        console.error('[TikTokDL] Error:', err)
        m.react('❌')
        m.reply(`❌ *ɢᴀɢᴀʟ ᴍᴇɴɢᴜɴᴅᴜʜ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
