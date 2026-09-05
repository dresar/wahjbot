const { getDatabase } = require('../../src/lib/database')
const config = require('../../config')

const pluginConfig = {
    name: 'autoreply',
    alias: ['smarttrigger', 'smarttriggers', 'ar'],
    category: 'group',
    description: 'Mengatur autoreply/smart triggers per grup',
    usage: '.autoreply on/off/add/del/list',
    example: '.autoreply on',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: false
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []
    const action = args[0]?.toLowerCase()
    
    const groupData = db.getGroup(m.chat) || {}
    const globalSmartTriggers = db.setting('smartTriggers') ?? config.features?.smartTriggers ?? false
    
    if (!action || action === 'status') {
        const groupStatus = groupData.autoreply
        const effectiveStatus = groupStatus ?? globalSmartTriggers
        const customReplies = groupData.customReplies || []
        
        let text = `🤖 *ᴀᴜᴛᴏʀᴇᴘʟʏ*\n\n`
        text += `╭┈┈⬡「 📋 *sᴛᴀᴛᴜs* 」\n`
        text += `┃ 🌐 ɢʟᴏʙᴀʟ: \`${globalSmartTriggers ? 'ON ✅' : 'OFF ❌'}\`\n`
        text += `┃ 👥 ɢʀᴜᴘ: \`${groupStatus === undefined ? 'DEFAULT' : (groupStatus ? 'ON ✅' : 'OFF ❌')}\`\n`
        text += `┃ ⚡ ᴇꜰꜰᴇᴄᴛɪᴠᴇ: \`${effectiveStatus ? 'ON ✅' : 'OFF ❌'}\`\n`
        text += `┃ 📝 ᴄᴜsᴛᴏᴍ: \`${customReplies.length}\` replies\n`
        text += `╰┈┈⬡\n\n`
        text += `> *Cara pakai:*\n`
        text += `> \`${m.prefix}autoreply on\` - Aktifkan\n`
        text += `> \`${m.prefix}autoreply off\` - Nonaktifkan\n`
        text += `> \`${m.prefix}autoreply add <trigger>|<reply>\`\n`
        text += `> \`${m.prefix}autoreply del <trigger>\`\n`
        text += `> \`${m.prefix}autoreply list\` - Lihat daftar\n`
        
        return m.reply(text)
    }
    
    if (action === 'on') {
        db.setGroup(m.chat, { ...groupData, autoreply: true })
        m.react('✅')
        return m.reply(`✅ *ᴀᴜᴛᴏʀᴇᴘʟʏ ᴅɪᴀᴋᴛɪꜰᴋᴀɴ*\n\n> Bot akan merespon otomatis di grup ini`)
    }
    
    if (action === 'off') {
        db.setGroup(m.chat, { ...groupData, autoreply: false })
        m.react('❌')
        return m.reply(`❌ *ᴀᴜᴛᴏʀᴇᴘʟʏ ᴅɪɴᴏɴᴀᴋᴛɪꜰᴋᴀɴ*\n\n> Bot tidak akan merespon otomatis di grup ini`)
    }
    
    if (action === 'add') {
        const input = args.slice(1).join(' ')
        
        if (!input.includes('|')) {
            return m.reply(
                `❌ *ꜰᴏʀᴍᴀᴛ sᴀʟᴀʜ*\n\n` +
                `> Gunakan format: \`trigger|reply\`\n\n` +
                `> Contoh:\n` +
                `> \`${m.prefix}autoreply add halo|Hai juga! 👋\`\n` +
                `> \`${m.prefix}autoreply add p|Ada yang bisa dibantu?\``
            )
        }
        
        const [trigger, ...replyParts] = input.split('|')
        const reply = replyParts.join('|').trim()
        
        if (!trigger.trim() || !reply) {
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Trigger dan reply tidak boleh kosong!`)
        }
        
        const customReplies = groupData.customReplies || []
        const existingIndex = customReplies.findIndex(r => r.trigger.toLowerCase() === trigger.trim().toLowerCase())
        
        if (existingIndex !== -1) {
            customReplies[existingIndex].reply = reply
        } else {
            customReplies.push({
                trigger: trigger.trim().toLowerCase(),
                reply: reply
            })
        }
        
        db.setGroup(m.chat, { ...groupData, customReplies })
        
        m.react('✅')
        return m.reply(
            `✅ *ᴀᴜᴛᴏʀᴇᴘʟʏ ᴅɪᴛᴀᴍʙᴀʜᴋᴀɴ*\n\n` +
            `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
            `┃ 🎯 ᴛʀɪɢɢᴇʀ: \`${trigger.trim()}\`\n` +
            `┃ 💬 ʀᴇᴘʟʏ: \`${reply.substring(0, 50)}${reply.length > 50 ? '...' : ''}\`\n` +
            `┃ 📊 ᴛᴏᴛᴀʟ: \`${customReplies.length}\` replies\n` +
            `╰┈┈⬡`
        )
    }
    
    if (action === 'del' || action === 'rm' || action === 'remove') {
        const trigger = args.slice(1).join(' ').toLowerCase().trim()
        
        if (!trigger) {
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Masukkan trigger yang mau dihapus!\n\n\`${m.prefix}autoreply del halo\``)
        }
        
        const customReplies = groupData.customReplies || []
        const index = customReplies.findIndex(r => r.trigger === trigger)
        
        if (index === -1) {
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Trigger \`${trigger}\` tidak ditemukan!`)
        }
        
        customReplies.splice(index, 1)
        db.setGroup(m.chat, { ...groupData, customReplies })
        
        m.react('🗑️')
        return m.reply(
            `🗑️ *ᴀᴜᴛᴏʀᴇᴘʟʏ ᴅɪʜᴀᴘᴜs*\n\n` +
            `> Trigger \`${trigger}\` berhasil dihapus!\n` +
            `> Sisa: \`${customReplies.length}\` replies`
        )
    }
    
    if (action === 'list') {
        const customReplies = groupData.customReplies || []
        
        const defaultTriggers = [
            { trigger: '@mention', reply: '👋 Hai! Ada yang manggil bot?' },
            { trigger: 'p', reply: '💬 Budayakan salam sebelum percakapan!' },
            { trigger: 'bot / ourin', reply: '🤖 Bot aktif dan siap!' },
            { trigger: 'assalamualaikum', reply: 'Waalaikumsalam saudaraku' }
        ]
        
        let text = `📋 *ᴅᴀꜰᴛᴀʀ ᴀᴜᴛᴏʀᴇᴘʟʏ*\n\n`
        
        text += `╭┈┈⬡「 🔧 *ᴅᴇꜰᴀᴜʟᴛ ᴛʀɪɢɢᴇʀs* 」\n`
        defaultTriggers.forEach((r, i) => {
            text += `┃ ${i + 1}. \`${r.trigger}\`\n`
            text += `┃    → ${r.reply}\n`
        })
        text += `╰┈┈⬡\n\n`
        
        if (customReplies.length > 0) {
            text += `╭┈┈⬡「 📝 *ᴄᴜsᴛᴏᴍ ᴛʀɪɢɢᴇʀs* 」\n`
            customReplies.forEach((r, i) => {
                text += `┃ ${i + 1}. \`${r.trigger}\`\n`
                text += `┃    → ${r.reply.substring(0, 35)}${r.reply.length > 35 ? '...' : ''}\n`
            })
            text += `╰┈┈⬡\n\n`
        } else {
            text += `> Belum ada custom trigger\n`
            text += `> \`${m.prefix}autoreply add trigger|reply\`\n\n`
        }
        
        text += `> _Default triggers tidak bisa di-edit_`
        
        return m.reply(text)
    }
    
    if (action === 'reset' || action === 'clear') {
        db.setGroup(m.chat, { ...groupData, customReplies: [] })
        m.react('🗑️')
        return m.reply(`🗑️ *ᴀᴜᴛᴏʀᴇᴘʟʏ ᴅɪʀᴇsᴇᴛ*\n\n> Semua autoreply custom dihapus!`)
    }
    
    return m.reply(`❌ *ᴀᴄᴛɪᴏɴ ᴛɪᴅᴀᴋ ᴠᴀʟɪᴅ*\n\n> Gunakan: \`on\`, \`off\`, \`add\`, \`del\`, \`list\`, \`reset\``)
}

module.exports = {
    config: pluginConfig,
    handler
}
