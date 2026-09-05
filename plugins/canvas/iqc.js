const axios = require('axios')

const pluginConfig = {
    name: 'iqc',
    alias: ['iqchat', 'iphonechat'],
    category: 'canvas',
    description: 'Membuat gambar chat iPhone style',
    usage: '.iqc <text>',
    example: '.iqc Hai cantik',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    limit: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = m.args.join(' ')
    if (!text) {
        return m.reply(`📱 *ɪǫᴄ ᴄʜᴀᴛ*\n\n> Masukkan teks untuk chat\n\n\`Contoh: ${m.prefix}iqc Hai cantik\``)
    }
    
    m.react('📱')
    
    try {
        const now = new Date()
        const jam = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
        const batre = Math.floor(Math.random() * 50) + 50
        
        const url = `https://api-faa.my.id/faa/iqcv2?prompt=${encodeURIComponent(text)}&jam=${jam}&batre=${batre}`
        
        const response = await axios.get(url, { 
            responseType: 'arraybuffer', 
            timeout: 60000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        })
        
        const contentType = response.headers['content-type'] || ''
        if (!contentType.includes('image')) {
            const textData = Buffer.from(response.data).toString('utf8')
            throw new Error(`API tidak mengembalikan gambar: ${textData.substring(0, 100)}`)
        }
        
        await sock.sendMessage(m.chat, {
            image: Buffer.from(response.data),
            caption: `📱 *ɪǫᴄ ᴄʜᴀᴛ*\n\n> \`${text}\``
        }, { quoted: m })
        
        m.react('✅')
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
