const axios = require('axios')

const pluginConfig = {
    name: 'txt2video',
    alias: ['text2video', 'texttovideo', 'aivideo'],
    category: 'ai',
    description: 'Generate video dari teks menggunakan AI',
    usage: '.txt2video <prompt>',
    example: '.txt2video anime girl dancing',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    limit: 3,
    isEnabled: true
}

async function handler(m, { sock }) {
    const prompt = m.args.join(' ')
    
    if (!prompt) {
        return m.reply(`🎬 *ᴛᴇxᴛ ᴛᴏ ᴠɪᴅᴇᴏ*\n\n> Masukkan prompt untuk generate video\n\n\`Contoh: ${m.prefix}txt2video anime girl dancing\``)
    }
    
    m.react('⏳')
    await m.reply(`🎬 Generating video...\n\n> Prompt: *${prompt}*\n> _Proses ini memerlukan waktu..._`)
    
    try {
        const res = await axios.get(`https://api.baguss.xyz/api/tools/text2video?prompt=${encodeURIComponent(prompt)}`, {
            timeout: 180000
        })
        
        if (!res.data?.success || !res.data?.video?.url) {
            m.react('❌')
            return m.reply(`❌ Gagal generate video`)
        }
        
        m.react('✅')
        
        await sock.sendMessage(m.chat, {
            video: { url: res.data.video.url },
            caption: `🎬 *ᴛᴇxᴛ ᴛᴏ ᴠɪᴅᴇᴏ*\n\n> Prompt: *${prompt}*\n> Size: ${res.data.video.size}`
        }, { quoted: m })
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
