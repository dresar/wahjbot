const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'blacklistjpm',
    alias: ['bljpm', 'jpmbl', 'jpmblacklist'],
    category: 'jpm',
    description: 'Blacklist grup dari JPM',
    usage: '.blacklistjpm add/del/list [link_grup/di_grup]',
    example: '.blacklistjpm add (di grup) atau .blacklistjpm list',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []
    const action = args[0]?.toLowerCase()
    
    let blacklist = db.setting('jpmBlacklist') || []
    
    if (!action || action === 'list') {
        if (blacklist.length === 0) {
            return m.reply(
                `📋 *ᴊᴘᴍ ʙʟᴀᴄᴋʟɪsᴛ*\n\n` +
                `> Tidak ada grup yang di-blacklist\n\n` +
                `> Cara pakai:\n` +
                `> \`${m.prefix}blacklistjpm add\` (di grup)\n` +
                `> \`${m.prefix}blacklistjpm add <link_grup>\`\n` +
                `> \`${m.prefix}blacklistjpm del\` (di grup)\n` +
                `> \`${m.prefix}blacklistjpm list\``
            )
        }
        
        let listText = `📋 *ᴊᴘᴍ ʙʟᴀᴄᴋʟɪsᴛ*\n\n`
        listText += `> Total: \`${blacklist.length}\` grup\n\n`
        
        for (let i = 0; i < blacklist.length; i++) {
            const groupId = blacklist[i]
            try {
                const meta = await sock.groupMetadata(groupId)
                listText += `${i + 1}. ${meta.subject}\n`
                listText += `   > \`${groupId}\`\n`
            } catch (e) {
                listText += `${i + 1}. Unknown Group\n`
                listText += `   > \`${groupId}\`\n`
            }
        }
        
        return m.reply(listText)
    }
    
    let targetGroup = null
    
    if (m.isGroup) {
        targetGroup = m.chat
    } else if (args[1]) {
        const linkMatch = args[1].match(/chat\.whatsapp\.com\/([a-zA-Z0-9]+)/)
        if (linkMatch) {
            try {
                const groupInfo = await sock.groupGetInviteInfo(linkMatch[1])
                targetGroup = groupInfo.id
            } catch (e) {
                return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Link grup tidak valid!`)
            }
        } else if (args[1].includes('@g.us')) {
            targetGroup = args[1]
        }
    }
    
    if (!targetGroup) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Jalankan di grup atau sertakan link grup!`)
    }
    
    let groupName = targetGroup
    try {
        const meta = await sock.groupMetadata(targetGroup)
        groupName = meta.subject
    } catch (e) {}
    
    if (action === 'add') {
        if (blacklist.includes(targetGroup)) {
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Grup *${groupName}* sudah ada di blacklist!`)
        }
        
        blacklist.push(targetGroup)
        db.setting('jpmBlacklist', blacklist)
        
        m.react('🚫')
        return m.reply(
            `🚫 *ᴅɪᴛᴀᴍʙᴀʜᴋᴀɴ ᴋᴇ ʙʟᴀᴄᴋʟɪsᴛ*\n\n` +
            `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
            `┃ 👥 ɢʀᴜᴘ: \`${groupName}\`\n` +
            `┃ 🚫 sᴛᴀᴛᴜs: Blacklisted\n` +
            `┃ 📊 ᴛᴏᴛᴀʟ ʙʟ: \`${blacklist.length}\` grup\n` +
            `╰┈┈⬡\n\n` +
            `> Grup ini tidak akan menerima JPM`
        )
    }
    
    if (action === 'del' || action === 'remove' || action === 'rm') {
        const index = blacklist.indexOf(targetGroup)
        
        if (index === -1) {
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Grup *${groupName}* tidak ada di blacklist!`)
        }
        
        blacklist.splice(index, 1)
        db.setting('jpmBlacklist', blacklist)
        
        m.react('✅')
        return m.reply(
            `✅ *ᴅɪʜᴀᴘᴜs ᴅᴀʀɪ ʙʟᴀᴄᴋʟɪsᴛ*\n\n` +
            `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
            `┃ 👥 ɢʀᴜᴘ: \`${groupName}\`\n` +
            `┃ ✅ sᴛᴀᴛᴜs: Unblacklisted\n` +
            `┃ 📊 sɪsᴀ ʙʟ: \`${blacklist.length}\` grup\n` +
            `╰┈┈⬡\n\n` +
            `> Grup ini akan menerima JPM lagi`
        )
    }
    
    return m.reply(
        `❌ *ᴀᴄᴛɪᴏɴ ᴛɪᴅᴀᴋ ᴠᴀʟɪᴅ*\n\n` +
        `> Gunakan: \`add\`, \`del\`, atau \`list\``
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
