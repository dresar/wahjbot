const config = require('../../config')
const fs = require('fs')
const path = require('path')
const { isLid, lidToJid } = require('../../src/lib/lidHelper')

const pluginConfig = {
    name: 'addownpanel',
    alias: ['delownpanel', 'listownpanel'],
    category: 'panel',
    description: 'Kelola owner panel',
    usage: '.addownpanel @user atau .delownpanel @user',
    example: '.addownpanel @user',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
}

function cleanJid(jid) {
    if (!jid) return null
    if (isLid(jid)) jid = lidToJid(jid)
    return jid.includes('@') ? jid : jid + '@s.whatsapp.net'
}

function getNumber(jid) {
    const clean = cleanJid(jid)
    return clean ? clean.split('@')[0] : null
}

function saveConfig() {
    try {
        const configPath = path.join(process.cwd(), 'config.js')
        let content = fs.readFileSync(configPath, 'utf8')
        const ownerPanelsStr = JSON.stringify(config.pterodactyl.ownerPanels)
        content = content.replace(
            /ownerPanels:\s*\[.*?\]/s,
            `ownerPanels: ${ownerPanelsStr}`
        )
        fs.writeFileSync(configPath, content, 'utf8')
        return true
    } catch (e) {
        console.error('[Panel] Failed to save config:', e.message)
        return false
    }
}

async function handler(m, { sock }) {
    const cmd = m.command.toLowerCase()
    const pteroConfig = config.pterodactyl
    
    if (!pteroConfig) {
        return m.reply(`❌ Konfigurasi pterodactyl tidak ditemukan di config.js`)
    }
    
    if (!pteroConfig.ownerPanels) {
        pteroConfig.ownerPanels = []
    }
    
    if (cmd === 'listownpanel') {
        if (pteroConfig.ownerPanels.length === 0) {
            return m.reply(`📋 *ᴅᴀꜰᴛᴀʀ ᴏᴡɴᴇʀ ᴘᴀɴᴇʟ*\n\n> Belum ada owner panel terdaftar.`)
        }
        
        let txt = `📋 *ᴅᴀꜰᴛᴀʀ ᴏᴡɴᴇʀ ᴘᴀɴᴇʟ*\n\n`
        txt += `> Total: *${pteroConfig.ownerPanels.length}* owner panel\n\n`
        pteroConfig.ownerPanels.forEach((s, i) => {
            txt += `${i + 1}. \`${s}\`\n`
        })
        return m.reply(txt)
    }
    
    let targetUser = null
    if (m.quoted?.sender) {
        targetUser = getNumber(m.quoted.sender)
    } else if (m.mentionedJid?.length > 0) {
        targetUser = getNumber(m.mentionedJid[0])
    } else if (m.text?.trim()) {
        targetUser = m.text.trim().replace(/[^0-9]/g, '')
    }
    
    if (!targetUser) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}${cmd} @user\`\n` +
            `> \`${m.prefix}${cmd} 628xxx\`\n` +
            `> Reply pesan user`
        )
    }
    
    if (cmd === 'addownpanel') {
        if (pteroConfig.ownerPanels.includes(targetUser)) {
            return m.reply(`❌ \`${targetUser}\` sudah menjadi owner panel.`)
        }
        
        pteroConfig.ownerPanels.push(targetUser)
        
        if (saveConfig()) {
            return m.reply(
                `✅ *ᴏᴡɴᴇʀ ᴘᴀɴᴇʟ ᴅɪᴛᴀᴍʙᴀʜᴋᴀɴ*\n\n` +
                `> Nomor: \`${targetUser}\`\n` +
                `> Total: *${pteroConfig.ownerPanels.length}*`
            )
        } else {
            pteroConfig.ownerPanels = pteroConfig.ownerPanels.filter(s => s !== targetUser)
            return m.reply(`❌ Gagal menyimpan ke config.js`)
        }
    }
    
    if (cmd === 'delownpanel') {
        if (!pteroConfig.ownerPanels.includes(targetUser)) {
            return m.reply(`❌ \`${targetUser}\` bukan owner panel.`)
        }
        
        pteroConfig.ownerPanels = pteroConfig.ownerPanels.filter(s => s !== targetUser)
        
        if (saveConfig()) {
            return m.reply(
                `✅ *ᴏᴡɴᴇʀ ᴘᴀɴᴇʟ ᴅɪʜᴀᴘᴜs*\n\n` +
                `> Nomor: \`${targetUser}\`\n` +
                `> Total: *${pteroConfig.ownerPanels.length}*`
            )
        } else {
            return m.reply(`❌ Gagal menyimpan ke config.js`)
        }
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
