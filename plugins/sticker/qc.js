const axios = require('axios')

const pluginConfig = {
    name: 'qc',
    alias: ['quotechat', 'fakechat'],
    category: 'sticker',
    description: 'Membuat sticker quote chat',
    usage: '.qc <text>|<nama>',
    example: '.qc Hai semua|Misaki',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    limit: 1,
    isEnabled: true
}

const DEFAULT_PP = 'https://files.cloudkuimages.guru/images/3673304e1dba.jpg'

async function getProfilePicture(sock, jid) {
    try {
        const pp = await sock.profilePictureUrl(jid, 'image')
        return pp || DEFAULT_PP
    } catch {
        return DEFAULT_PP
    }
}

async function qcText(text, name, url) {
    const body = {
        type: 'quote',
        format: 'webp',
        backgroundColor: '#FFFFFF',
        width: 512,
        height: 512,
        scale: 2,
        messages: [{
            avatar: true,
            from: {
                first_name: name,
                language_code: 'en',
                name: name,
                photo: {
                    url: url
                }
            },
            text: text,
            replyMessage: {}
        }]
    }
    
    const res = await axios.post('https://qc.botcahx.eu.org/generate', body, {
        timeout: 30000
    })
    
    return Buffer.from(res.data.result.image, 'base64')
}

async function qcImg(mediaUrl, text, name, avatar) {
    const body = {
        type: 'quote',
        format: 'png',
        backgroundColor: '#FFFFFF',
        width: 512,
        height: 768,
        scale: 2,
        messages: [{
            entities: [],
            media: {
                url: mediaUrl
            },
            avatar: true,
            from: {
                id: 1,
                name: name,
                photo: {
                    url: avatar
                }
            },
            text: text,
            replyMessage: {}
        }]
    }
    
    const res = await axios.post('https://qc.botcahx.eu.org/generate', body, {
        timeout: 30000
    })
    
    return Buffer.from(res.data.result.image, 'base64')
}

async function handler(m, { sock }) {
    const input = m.args.join(' ')
    
    let text, name
    if (input.includes('|')) {
        [text, name] = input.split('|').map(s => s.trim())
    } else {
        text = input
        name = m.pushName || 'User'
    }
    
    let hasMedia = false
    let mediaBuffer = null
    let mediaUrl = null
    
    if (m.quoted) {
        const quotedType = m.quoted.type || ''
        if (quotedType.includes('image') || m.quoted.mimetype?.includes('image')) {
            hasMedia = true
            try {
                mediaBuffer = await m.quoted.download()
            } catch {
                hasMedia = false
            }
        }
        
        if (!name || name === m.pushName) {
            name = m.quoted.pushName || m.quoted.sender?.split('@')[0] || 'User'
        }
    }
    
    if (m.type?.includes('image') || m.mimetype?.includes('image')) {
        hasMedia = true
        try {
            mediaBuffer = await m.download()
        } catch {
            hasMedia = false
        }
    }
    
    if (!text && !hasMedia) {
        return m.reply(
            `💬 *ǫᴜᴏᴛᴇ ᴄʜᴀᴛ*\n\n` +
            `╭┈┈⬡「 📋 *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ* 」\n` +
            `┃ ◦ \`.qc text\` - Text only\n` +
            `┃ ◦ \`.qc text|nama\` - Custom nama\n` +
            `┃ ◦ Reply gambar + \`.qc text\`\n` +
            `┃ ◦ Kirim gambar + caption \`.qc text\`\n` +
            `╰┈┈⬡\n\n` +
            `\`Contoh: ${m.prefix}qc Hai semua\`\n` +
            `\`Contoh: ${m.prefix}qc Hai|Misaki\``
        )
    }
    
    m.react('💬')
    
    try {
        let profileUrl = DEFAULT_PP
        
        if (m.quoted && m.quoted.sender) {
            profileUrl = await getProfilePicture(sock, m.quoted.sender)
        } else {
            profileUrl = await getProfilePicture(sock, m.sender)
        }
        
        let buffer
        
        if (hasMedia && mediaBuffer) {
            const { fetchBuffer } = require('../../src/lib/functions')
            
            const FormData = require('form-data')
            const formData = new FormData()
            formData.append('file', mediaBuffer, { filename: 'image.jpg' })
            
            let uploadedUrl = null
            try {
                const uploadRes = await axios.post('https://telegra.ph/upload', formData, {
                    headers: formData.getHeaders(),
                    timeout: 30000
                })
                if (uploadRes.data && uploadRes.data[0]?.src) {
                    uploadedUrl = 'https://telegra.ph' + uploadRes.data[0].src
                }
            } catch {
                uploadedUrl = null
            }
            
            if (uploadedUrl) {
                buffer = await qcImg(uploadedUrl, text || '', name, profileUrl)
            } else {
                buffer = await qcText(text || 'Image', name, profileUrl)
            }
        } else {
            buffer = await qcText(text, name, profileUrl)
        }
        
        if (!buffer || buffer.length === 0) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> API tidak merespon`)
        }
        
        await sock.sendImageAsSticker(m.chat, buffer, m, {
            packname: 'Ourin-AI',
            author: m.pushName || 'User'
        })
        
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
