const { config } = require("../../config")

const pluginConfig = {
    name: 'rch',
    alias: ['frch', 'reactch', 'fakereactch', 'fakerch'],
    category: 'tools',
    description: 'Kirim react ke post channel WhatsApp',
    usage: '.rch <link_post> <emoji>',
    example: '.rch https://whatsapp.com/channel/xxx/123 😂',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    limit: 1,
    isEnabled: true
}

const API_KEYS = config.apiReactCh

async function handler(m, { sock }) {
    const args = m.args || []
    
    if (args.length < 2) {
        return m.reply(
            `⚠️ *ꜰᴏʀᴍᴀᴛ sᴀʟᴀʜ!*\n\n` +
            `> Gunakan format:\n` +
            `> \`${m.prefix}rch <link_post> <emoji>\`\n\n` +
            `📌 *Contoh:*\n` +
            `> \`${m.prefix}rch https://whatsapp.com/channel/xxx/123 😂\`\n` +
            `> \`${m.prefix}rch https://whatsapp.com/channel/xxx/123 😂 😱 🔥\``
        )
    }
    
    const link = args[0]
    const emoji = args.slice(1).join(' ').replace(/,/g, ' ').split(/\s+/).filter(e => e.trim()).join(',')
    
    if (!link.includes('whatsapp.com/channel')) {
        return m.reply(`❌ *ʟɪɴᴋ ᴛɪᴅᴀᴋ ᴠᴀʟɪᴅ*\n\n> Masukkan link post channel WhatsApp yang valid!`)
    }
    
    if (!emoji) {
        return m.reply(`❌ *ᴇᴍᴏᴊɪ ᴋᴏsᴏɴɢ*\n\n> Masukkan emoji untuk react!`)
    }
    
    m.react('⏳')
    
    let success = false
    let lastError = 'Unknown error'
    let responseData = null
    
    for (let i = 0; i < API_KEYS.length; i++) {
        const apiKey = API_KEYS[i]
        try {
            console.log(`[RCH] Trying key ${i + 1}/${API_KEYS.length}: ${apiKey.substring(0, 8)}...`)
            const url = `https://react.whyux-xec.my.id/api/rch?link=${encodeURIComponent(link)}&emoji=${encodeURIComponent(emoji)}`
            
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'x-api-key': apiKey
                }
            })

            console.log(res)
            
            const json = await res.json()
            console.log(`[RCH] Response key ${i + 1}:`, json.success ? 'SUCCESS' : json.error || json.details?.message)
            
            if (json.success) {
                responseData = json
                success = true
                console.log(`[RCH] Success with key ${i + 1}`)
                break
            } else {
                lastError = json.details?.message || json.error || 'Unknown error'
            }
        } catch (e) {
            console.error(`[RCH] Key ${i + 1} Error:`, e.message)
            lastError = 'Terjadi kesalahan sistem'
        }
    }
    
    if (success && responseData) {
        m.react('✅')
        await m.reply(
            `✅ *ʀᴇᴀᴄᴛ sᴇɴᴛ!*\n\n` +
            `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
            `┃ 🔗 ᴛᴀʀɢᴇᴛ: \`${responseData.link || link}\`\n` +
            `┃ 🎭 ᴇᴍᴏᴊɪ: ${(responseData.emojis || emoji).replace(/,/g, ' ')}\n` +
            `╰┈┈⬡`
        )
    } else {
        m.react('❌')
        await m.reply(
            `❌ *ɢᴀɢᴀʟ ᴍᴇɴɢɪʀɪᴍ ʀᴇᴀᴋsɪ*\n\n` +
            `> Error: ${lastError}\n\n` +
            `> Pastikan link valid dan emoji didukung!`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
