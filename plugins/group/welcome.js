const config = require('../../config')
const { getDatabase } = require('../../src/lib/database')
const { createWideDiscordCard } = require('../../src/lib/welcomeCard')
const { resolveAnyLidToJid } = require('../../src/lib/lidHelper')
const path = require('path')
const fs = require('fs')
const axios = require('axios')

const pluginConfig = {
    name: 'welcome',
    alias: ['wc'],
    category: 'group',
    description: 'Mengatur welcome message untuk grup',
    usage: '.welcome <on/off>',
    example: '.welcome on',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    cooldown: 5,
    limit: 0,
    isEnabled: true
}

function buildWelcomeMessage(participant, groupName, groupDesc, memberCount, customMsg = null) {
    const emojis = ['🎉', '🎊', '✨', '🌟', '💫', '🎈']
    const greeting = ['Selamat datang', 'Welcome', 'Hai', 'Halo', 'Assalamualaikum'][Math.floor(Math.random() * 5)]
    const emoji = emojis[Math.floor(Math.random() * emojis.length)]
    
    if (customMsg) {
        return customMsg
            .replace(/{user}/gi, `@${participant?.split('@')[0] || 'User'}`)
            .replace(/{group}/gi, groupName || 'Grup')
            .replace(/{desc}/gi, groupDesc || '')
            .replace(/{count}/gi, memberCount?.toString() || '0')
    }
    
    return `╭━━━━━━━━━━━━━━━━━╮\n` +
           `┃ ${emoji} *WELCOME MEMBER* ${emoji}\n` +
           `╰━━━━━━━━━━━━━━━━━╯\n\n` +
           `> ${greeting}, @${participant?.split('@')[0]}! 👋\n` +
           `> Welcome to *${groupName}*\n\n` +
           `╭┈┈⬡「 🏠 *INFO GRUP* 」\n` +
           `┃ ◦ Member: *${memberCount}*\n` +
           `┃ ◦ Desk: ${groupDesc ? `\n${groupDesc}` : '-'}\n` +
           `╰┈┈┈┈┈┈┈┈⬡\n\n` +
           `_Betah betah disini yak adik adik!_`
}

async function sendWelcomeMessage(sock, groupJid, participant, groupMeta) {
    try {
        const db = getDatabase()
        const groupData = db.getGroup(groupJid)
        
        if (groupData?.welcome !== true) return false

        const realParticipant = resolveAnyLidToJid(participant, groupMeta?.participants || [])
        const memberCount = groupMeta?.participants?.length || 0
        const groupName = groupMeta?.subject || 'Grup'
        
        let userName = realParticipant?.split('@')[0] || 'User'
        try {
            const pushName = await sock.getName(realParticipant)
            if (pushName && pushName.trim()) userName = pushName
        } catch {}
        
        const fallbackPP = path.join(process.cwd(), 'assets', 'images', 'pp-kosong.jpg')
        let ppUrl = fs.existsSync(fallbackPP) ? fallbackPP : 'https://i.imgur.com/TuItj4L.png'
        try {
            ppUrl = await sock.profilePictureUrl(realParticipant, 'image') || ppUrl
        } catch {}

        let canvasBuffer = null
        try {
            canvasBuffer = await createWideDiscordCard('WELCOME', userName, ppUrl, memberCount.toLocaleString())
        } catch (e) {
            console.error('Welcome Canvas Error:', e.message)
        }

        const text = buildWelcomeMessage(
            realParticipant,
            groupMeta?.subject,
            groupMeta?.desc,
            memberCount,
            groupData?.welcomeMsg
        )

        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'

        await sock.sendMessage(groupJid, {
            text,
            mentions: [realParticipant],
            contextInfo: {
                mentionedJid: [realParticipant],
                forwardingScore: 9999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: saluranId,
                    newsletterName: saluranName,
                    serverMessageId: 127
                },
                externalAdReply: {
                    sourceUrl: config.info?.website || 'https://sc.ourin.my.id/',
                    mediaType: 1,
                    thumbnail: canvasBuffer,
                    title: `Welcome ${userName}`,
                    body: `Member ke-${memberCount} di ${groupName}`,
                    renderLargerThumbnail: true
                }
            }
        })
        
        return true
    } catch (error) {
        console.error('Welcome Error:', error)
        return false
    }
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []
    const sub = args[0]?.toLowerCase()
    const sub2 = args[1]?.toLowerCase()
    const groupData = db.getGroup(m.chat) || {}
    const currentStatus = groupData.welcome === true
    
    if (sub === 'on' && sub2 === 'all') {
        if (!m.isOwner) {
            return m.reply(`❌ Hanya owner yang bisa menggunakan fitur ini!`)
        }
        
        m.react('⏳')
        
        try {
            const groups = await sock.groupFetchAllParticipating()
            const groupIds = Object.keys(groups)
            let count = 0
            
            for (const groupId of groupIds) {
                db.setGroup(groupId, { welcome: true })
                count++
            }
            
            m.react('✅')
            return m.reply(
                `✅ *ᴡᴇʟᴄᴏᴍᴇ ɢʟᴏʙᴀʟ ᴏɴ*\n\n` +
                `> Welcome diaktifkan di *${count}* grup!`
            )
        } catch (err) {
            m.react('❌')
            return m.reply(`❌ Error: ${err.message}`)
        }
    }
    
    if (sub === 'off' && sub2 === 'all') {
        if (!m.isOwner) {
            return m.reply(`❌ Hanya owner yang bisa menggunakan fitur ini!`)
        }
        
        m.react('⏳')
        
        try {
            const groups = await sock.groupFetchAllParticipating()
            const groupIds = Object.keys(groups)
            let count = 0
            
            for (const groupId of groupIds) {
                db.setGroup(groupId, { welcome: false })
                count++
            }
            
            m.react('✅')
            return m.reply(
                `❌ *ᴡᴇʟᴄᴏᴍᴇ ɢʟᴏʙᴀʟ ᴏꜰꜰ*\n\n` +
                `> Welcome dinonaktifkan di *${count}* grup!`
            )
        } catch (err) {
            m.react('❌')
            return m.reply(`❌ Error: ${err.message}`)
        }
    }
    
    if (sub === 'on') {
        if (currentStatus) {
            return m.reply(
                `⚠️ *ᴡᴇʟᴄᴏᴍᴇ ᴀʟʀᴇᴀᴅʏ ᴀᴄᴛɪᴠᴇ*\n\n` +
                `> Status: *✅ ON*\n` +
                `> Welcome sudah aktif di grup ini.\n\n` +
                `_Gunakan \`${m.prefix}welcome off\` untuk menonaktifkan._`
            )
        }
        db.setGroup(m.chat, { welcome: true })
        return m.reply(
            `✅ *ᴡᴇʟᴄᴏᴍᴇ ᴀᴋᴛɪꜰ*\n\n` +
            `> Welcome message berhasil diaktifkan!\n` +
            `> Member baru akan disambut otomatis.\n\n` +
            `_Gunakan \`${m.prefix}setwelcome\` untuk custom pesan._`
        )
    }
    
    if (sub === 'off') {
        if (!currentStatus) {
            return m.reply(
                `⚠️ *ᴡᴇʟᴄᴏᴍᴇ ᴀʟʀᴇᴀᴅʏ ɪɴᴀᴄᴛɪᴠᴇ*\n\n` +
                `> Status: *❌ OFF*\n` +
                `> Welcome sudah nonaktif di grup ini.\n\n` +
                `_Gunakan \`${m.prefix}welcome on\` untuk mengaktifkan._`
            )
        }
        db.setGroup(m.chat, { welcome: false })
        return m.reply(
            `❌ *ᴡᴇʟᴄᴏᴍᴇ ɴᴏɴᴀᴋᴛɪꜰ*\n\n` +
            `> Welcome message berhasil dinonaktifkan.\n` +
            `> Member baru tidak akan disambut.`
        )
    }
    
    m.reply(
        `👋 *ᴡᴇʟᴄᴏᴍᴇ sᴇᴛᴛɪɴɢs*\n\n` +
        `> Status: *${currentStatus ? '✅ ON' : '❌ OFF'}*\n\n` +
        `\`\`\`━━━ ᴘɪʟɪʜᴀɴ ━━━\`\`\`\n` +
        `> \`${m.prefix}welcome on\` → Aktifkan\n` +
        `> \`${m.prefix}welcome off\` → Nonaktifkan\n` +
        `> \`${m.prefix}welcome on all\` → Global ON (owner)\n` +
        `> \`${m.prefix}welcome off all\` → Global OFF (owner)\n` +
        `> \`${m.prefix}setwelcome\` → Custom pesan\n` +
        `> \`${m.prefix}resetwelcome\` → Reset default`
    )
}

module.exports = {
    config: pluginConfig,
    handler,
    sendWelcomeMessage
}
