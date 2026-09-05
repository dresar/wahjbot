const axios = require('axios')

const pluginConfig = {
    name: 'android1',
    alias: ['an1', 'modapk'],
    category: 'search',
    description: 'Cari APK MOD di Android1',
    usage: '.android1 <query>',
    example: '.android1 Subway Surfer',
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
            `> \`${m.prefix}android1 <query>\`\n\n` +
            `> Contoh:\n` +
            `> \`${m.prefix}android1 Subway Surfer\``
        )
    }
    
    try {
        const res = await axios.get(`https://api.nekolabs.web.id/dsc/android1/search?q=${encodeURIComponent(query)}`)
        
        if (!res.data?.success || !res.data?.result?.length) {
            return m.reply(`❌ Tidak ditemukan hasil untuk: ${query}`)
        }
        
        const apps = res.data.result.slice(0, 5)
        
        let txt = `📱 *ᴀɴᴅʀᴏɪᴅ1 sᴇᴀʀᴄʜ*\n\n`
        txt += `> Query: *${query}*\n\n`
        
        apps.forEach((a, i) => {
            txt += `*${i + 1}.* \`\`\`${a.name}\`\`\`\n`
            txt += `   ├ 👤 \`${a.developer}\`\n`
            txt += `   ├ ⭐ \`${a.rating}/5\`\n`
            txt += `   └ 🔗 \`${a.url}\`\n\n`
        })
        
        return m.reply(txt.trim())
        
    } catch (err) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
