const axios = require('axios')

const pluginConfig = {
    name: 'hd2',
    alias: ['enhance2', 'upscale2'],
    category: 'tools',
    description: 'Enhance gambar menjadi HD v2',
    usage: '.hd2 (reply gambar)',
    example: '.hd2',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    limit: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.type === 'imageMessage')
    
    if (!isImage) {
        return m.reply(`✨ *ʜᴅ ᴇɴʜᴀɴᴄᴇ ᴠ2*\n\n> Kirim/reply gambar untuk di-enhance\n\n\`${m.prefix}hd2\``)
    }
    
    m.react('⏳')
    
    try {
        let buffer
        if (m.quoted && m.quoted.isMedia) {
            buffer = await m.quoted.download()
        } else if (m.isMedia) {
            buffer = await m.download()
        }
        
        if (!buffer) {
            m.react('❌')
            return m.reply(`❌ Gagal mendownload gambar`)
        }
        
        const FormData = require('form-data')
        const formData = new FormData()
        formData.append('file', buffer, { filename: 'image.jpg' })
        
        const uploadRes = await axios.post('https://catbox.moe/user/api.php', formData, {
            headers: { ...formData.getHeaders() },
            params: { reqtype: 'fileupload' },
            timeout: 60000
        })
        
        const imageUrl = uploadRes.data
        
        const res = await axios.get(`https://api-faa.my.id/faa/hdv4?image=${encodeURIComponent(imageUrl)}`, {
            timeout: 120000
        })
        
        if (!res.data?.status || !res.data?.result?.image_upscaled) {
            m.react('❌')
            return m.reply(`❌ Gagal enhance gambar`)
        }
        
        m.react('✅')
        
        await sock.sendMessage(m.chat, {
            image: { url: res.data.result.image_upscaled },
            caption: `✨ *ʜᴅ ᴇɴʜᴀɴᴄᴇ ᴠ2*`
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
