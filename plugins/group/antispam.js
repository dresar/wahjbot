const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'antispam',
    alias: ['setantispam'],
    category: 'group',
    description: 'Mengaktifkan/menonaktifkan anti spam',
    usage: '.antispam <on/off> [max_pesan] [interval_detik]',
    example: '.antispam on 5 10',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    cooldown: 5,
    limit: 0,
    isEnabled: true
}

const spamTracker = new Map()

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []
    const subCmd = args[0]?.toLowerCase()
    
    let groupData = db.getGroup(m.chat) || {}
    
    if (!subCmd) {
        const status = groupData.antispam?.enabled ? '✅ ON' : '❌ OFF'
        const maxMsg = groupData.antispam?.maxMessages || 5
        const interval = groupData.antispam?.interval || 10
        
        let txt = `🛡️ *ᴀɴᴛɪsᴘᴀᴍ*\n\n`
        txt += `> Status: *${status}*\n`
        txt += `> Max pesan: *${maxMsg}* dalam *${interval}* detik\n\n`
        txt += `\`\`\`━━━ ᴘᴀɴᴅᴜᴀɴ ━━━\`\`\`\n`
        txt += `> ◦ \`${m.prefix}antispam on\` - Aktifkan\n`
        txt += `> ◦ \`${m.prefix}antispam off\` - Nonaktifkan\n`
        txt += `> ◦ \`${m.prefix}antispam on 5 10\`\n`
        txt += `>   Max 5 pesan dalam 10 detik`
        
        await m.reply(txt)
        return
    }
    
    if (subCmd === 'on') {
        const maxMessages = parseInt(args[1]) || 5
        const interval = parseInt(args[2]) || 10
        
        if (maxMessages < 2 || maxMessages > 20) {
            await m.reply(`⚠️ Max pesan harus 2-20.`)
            return
        }
        
        if (interval < 5 || interval > 60) {
            await m.reply(`⚠️ Interval harus 5-60 detik.`)
            return
        }
        
        db.setGroup(m.chat, {
            ...groupData,
            antispam: {
                enabled: true,
                maxMessages: maxMessages,
                interval: interval
            }
        })
        
        await m.reply(
            `✅ *ᴀɴᴛɪsᴘᴀᴍ ᴀᴋᴛɪꜰ*\n\n` +
            `> Max: *${maxMessages}* pesan dalam *${interval}* detik\n` +
            `> Aksi: *Warning otomatis*`
        )
        return
    }
    
    if (subCmd === 'off') {
        db.setGroup(m.chat, {
            ...groupData,
            antispam: { enabled: false }
        })
        
        await m.reply(`❌ Antispam *dinonaktifkan*!`)
        return
    }
    
    await m.reply(`❌ Gunakan \`${m.prefix}antispam on\` atau \`${m.prefix}antispam off\``)
}
function checkSpam(m, sock, db) {
    if (!m.isGroup) return false
    
    const groupData = db.getGroup(m.chat) || {}
    if (!groupData.antispam?.enabled) return false
    
    const maxMessages = groupData.antispam?.maxMessages || 5
    const interval = groupData.antispam?.interval || 10
    const key = `${m.chat}_${m.sender}`
    const now = Date.now()
    
    let userData = spamTracker.get(key) || { count: 0, firstTime: now }
    if (now - userData.firstTime > interval * 1000) {
        userData = { count: 1, firstTime: now }
    } else {
        userData.count++
    }
    
    spamTracker.set(key, userData)
    
    if (userData.count >= maxMessages) {
        spamTracker.delete(key)
        return true
    }
    
    return false
}

module.exports = {
    config: pluginConfig,
    handler,
    checkSpam
}
