const config = require('../../config')
const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'addowner',
    alias: ['setowner', 'tambahowner'],
    category: 'owner',
    description: 'Menambahkan owner baru ke bot',
    usage: '.addowner <nomor/@tag/reply>',
    example: '.addowner 6281234567890',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    limit: 0,
    isEnabled: true
}

function extractNumber(m) {
    let targetNumber = ''
    
    if (m.quoted) {
        targetNumber = m.quoted.sender?.replace(/[^0-9]/g, '') || ''
    } else if (m.mentionedJid?.length) {
        targetNumber = m.mentionedJid[0]?.replace(/[^0-9]/g, '') || ''
    } else if (m.args[0]) {
        targetNumber = m.args[0].replace(/[^0-9]/g, '')
    }
    
    if (targetNumber.startsWith('0')) {
        targetNumber = '62' + targetNumber.slice(1)
    }
    
    return targetNumber
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const targetNumber = extractNumber(m)
    
    if (!targetNumber) {
        return m.reply(
            `👑 *ᴀᴅᴅ ᴏᴡɴᴇʀ*\n\n` +
            `╭┈┈⬡「 📋 *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ* 」\n` +
            `┃ ◦ Reply pesan user\n` +
            `┃ ◦ Tag user @mention\n` +
            `┃ ◦ Ketik nomor langsung\n` +
            `╰┈┈⬡\n\n` +
            `\`Contoh: ${m.prefix}addowner 6281234567890\``
        )
    }
    
    if (targetNumber.length < 10 || targetNumber.length > 15) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Format nomor tidak valid`)
    }
    
    const staticOwners = config.owner?.number || []
    const dynamicOwners = db.setting('dynamicOwners') || []
    const allOwners = [...staticOwners, ...dynamicOwners]
    
    if (allOwners.includes(targetNumber)) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Nomor \`${targetNumber}\` sudah menjadi owner`)
    }
    
    dynamicOwners.push(targetNumber)
    db.setting('dynamicOwners', dynamicOwners)
    
    if (!config.dynamicOwners) config.dynamicOwners = []
    config.dynamicOwners.push(targetNumber)
    
    m.react('👑')
    
    await m.reply(
        `👑 *ᴏᴡɴᴇʀ ᴅɪᴛᴀᴍʙᴀʜᴋᴀɴ*\n\n` +
        `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
        `┃ 📱 ɴᴏᴍᴏʀ: \`${targetNumber}\`\n` +
        `┃ 👑 sᴛᴀᴛᴜs: \`Owner\`\n` +
        `┃ 📊 ᴛᴏᴛᴀʟ: \`${staticOwners.length + dynamicOwners.length}\` ᴏᴡɴᴇʀ\n` +
        `╰┈┈⬡\n\n` +
        `> _Owner ini akan tetap tersimpan meski bot restart_`
    )
}

function loadDynamicOwners() {
    try {
        const { getDatabase } = require('../../src/lib/database')
        const db = getDatabase()
        const dynamicOwners = db.setting('dynamicOwners') || []
        
        if (dynamicOwners.length > 0) {
            config.dynamicOwners = dynamicOwners
            console.log(`[AddOwner] Loaded ${dynamicOwners.length} dynamic owners`)
        }
    } catch (e) {
        console.error('[AddOwner] Failed to load dynamic owners:', e.message)
    }
}

loadDynamicOwners()

module.exports = {
    config: pluginConfig,
    handler,
    loadDynamicOwners
}
