const config = require('../../config')
const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'delowner',
    alias: ['removeowner', 'hapusowner'],
    category: 'owner',
    description: 'Menghapus owner dari bot',
    usage: '.delowner <nomor/@tag/reply>',
    example: '.delowner 6281234567890',
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
            `👑 *ᴅᴇʟ ᴏᴡɴᴇʀ*\n\n` +
            `╭┈┈⬡「 📋 *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ* 」\n` +
            `┃ ◦ Reply pesan user\n` +
            `┃ ◦ Tag user @mention\n` +
            `┃ ◦ Ketik nomor langsung\n` +
            `╰┈┈⬡\n\n` +
            `\`Contoh: ${m.prefix}delowner 6281234567890\``
        )
    }
    
    const staticOwners = config.owner?.number || []
    const dynamicOwners = db.setting('dynamicOwners') || []
    
    const staticIndex = staticOwners.findIndex(num => {
        const cleanNum = num?.replace(/[^0-9]/g, '') || ''
        return cleanNum.includes(targetNumber) || targetNumber.includes(cleanNum)
    })
    
    const dynamicIndex = dynamicOwners.findIndex(num => {
        const cleanNum = num?.replace(/[^0-9]/g, '') || ''
        return cleanNum.includes(targetNumber) || targetNumber.includes(cleanNum)
    })
    
    if (staticIndex === -1 && dynamicIndex === -1) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Nomor \`${targetNumber}\` bukan owner`)
    }
    
    const totalOwners = staticOwners.length + dynamicOwners.length
    if (totalOwners <= 1) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Tidak bisa menghapus owner terakhir`)
    }
    
    let removedNumber = ''
    let removedFrom = ''
    
    if (dynamicIndex !== -1) {
        removedNumber = dynamicOwners.splice(dynamicIndex, 1)[0]
        removedFrom = 'Dynamic'
        db.setting('dynamicOwners', dynamicOwners)
        
        if (config.dynamicOwners) {
            const configIndex = config.dynamicOwners.findIndex(num => 
                num?.replace(/[^0-9]/g, '').includes(targetNumber) || 
                targetNumber.includes(num?.replace(/[^0-9]/g, ''))
            )
            if (configIndex !== -1) config.dynamicOwners.splice(configIndex, 1)
        }
    } else if (staticIndex !== -1) {
        removedNumber = config.owner.number.splice(staticIndex, 1)[0]
        removedFrom = 'Static'
    }
    
    m.react('✅')
    
    const newTotal = (config.owner?.number?.length || 0) + (dynamicOwners.length || 0)
    
    await m.reply(
        `✅ *ᴏᴡɴᴇʀ ᴅɪʜᴀᴘᴜs*\n\n` +
        `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
        `┃ 📱 ɴᴏᴍᴏʀ: \`${removedNumber}\`\n` +
        `┃ 📂 ᴛʏᴘᴇ: \`${removedFrom}\`\n` +
        `┃ ❌ sᴛᴀᴛᴜs: \`Removed\`\n` +
        `┃ 📊 sɪsᴀ: \`${newTotal}\` ᴏᴡɴᴇʀ\n` +
        `╰┈┈⬡`
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
