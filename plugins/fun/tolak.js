const { getDatabase } = require('../../src/lib/database')
const config = require('../../config')
const path = require('path')
const fs = require('fs')

const pluginConfig = {
    name: 'tolak',
    alias: ['reject', 'no', 'gaktau'],
    category: 'fun',
    description: 'Menolak tembakan dari seseorang',
    usage: '.tolak @tag',
    example: '.tolak @628xxx',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
}

let thumbFun = null
try {
    const thumbPath = path.join(process.cwd(), 'assets', 'images', 'ourin-games.jpg')
    if (fs.existsSync(thumbPath)) thumbFun = fs.readFileSync(thumbPath)
} catch (e) {}

function getContextInfo(title = '💔 *ᴛᴏʟᴀᴋ*', body = 'Rejected!') {
    const saluranId = config.saluran?.id || '120363208449943317@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
    
    const contextInfo = {
        forwardingScore: 9999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: saluranId,
            newsletterName: saluranName,
            serverMessageId: 127
        }
    }
    
    if (thumbFun) {
        contextInfo.externalAdReply = {
            title: title,
            body: body,
            thumbnail: thumbFun,
            mediaType: 1,
            renderLargerThumbnail: true,
            sourceUrl: config.saluran?.link || ''
        }
    }
    
    return contextInfo
}

async function handler(m, { sock }) {
    const db = getDatabase()
    
    let shooterJid = null
    
    if (m.quoted) {
        shooterJid = m.quoted.sender
    } else if (m.mentionedJid?.[0]) {
        shooterJid = m.mentionedJid[0]
    }
    
    if (!shooterJid) {
        const sessions = global.tembakSessions || {}
        const mySession = Object.entries(sessions).find(
            ([key, val]) => val.target === m.sender && val.chat === m.chat
        )
        
        if (mySession) {
            shooterJid = mySession[1].shooter
        }
    }
    
    if (!shooterJid) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> Reply pesan tembakan + \`${m.prefix}tolak\`\n` +
            `> Atau \`${m.prefix}tolak @tag\``
        )
    }
    
    if (shooterJid === m.sender) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Tidak bisa menolak diri sendiri!`)
    }
    
    if (shooterJid === m.botNumber) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Bot tidak punya hati untuk ditolak!`)
    }
    
    let shooterData = db.getUser(shooterJid) || {}
    let myData = db.getUser(m.sender) || {}
    
    if (!shooterData.fun) shooterData.fun = {}
    if (!myData.fun) myData.fun = {}
    
    if (shooterData.fun.pasangan !== m.sender) {
        return m.reply(
            `❌ *ᴛɪᴅᴀᴋ ᴍᴇɴᴇᴍʙᴀᴋ*\n\n` +
            `> @${shooterJid.split('@')[0]} tidak sedang menembakmu`,
            { mentions: [shooterJid] }
        )
    }
    
    shooterData.fun.pasangan = ''
    myData.fun.pasangan = ''
    
    db.setUser(shooterJid, shooterData)
    db.setUser(m.sender, myData)
    
    const sessionKey = `${m.chat}_${m.sender}`
    if (global.tembakSessions?.[sessionKey]) {
        delete global.tembakSessions[sessionKey]
    }
    
    await m.react('💔')
    await sock.sendMessage(m.chat, {
        text: `💔 *ᴅɪᴛᴏʟᴀᴋ!*\n\n` +
            `@${m.sender.split('@')[0]} menolak @${shooterJid.split('@')[0]}\n\n` +
            `> Sabar ya, masih banyak yang lain! 😢`,
        mentions: [m.sender, shooterJid],
        contextInfo: getContextInfo('💔 *ᴅɪᴛᴏʟᴀᴋ*', 'Move on!')
    }, { quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler
}
