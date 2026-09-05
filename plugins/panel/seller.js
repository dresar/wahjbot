const config = require('../../config')
const fs = require('fs')
const path = require('path')
const { isLid, lidToJid } = require('../../src/lib/lidHelper')

const pluginConfig = {
    name: 'addseller',
    alias: ['delseller', 'listseller'],
    category: 'panel',
    description: 'Kelola seller panel',
    usage: '.addseller @user atau .delseller @user',
    example: '.addseller @user',
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
        const sellersStr = JSON.stringify(config.pterodactyl.sellers)
        content = content.replace(
            /sellers:\s*\[.*?\]/s,
            `sellers: ${sellersStr}`
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
    
    if (!pteroConfig.sellers) {
        pteroConfig.sellers = []
    }
    
    if (cmd === 'listseller') {
        if (pteroConfig.sellers.length === 0) {
            return m.reply(`📋 *ᴅᴀꜰᴛᴀʀ sᴇʟʟᴇʀ*\n\n> Belum ada seller terdaftar.`)
        }
        
        let txt = `📋 *ᴅᴀꜰᴛᴀʀ sᴇʟʟᴇʀ*\n\n`
        txt += `> Total: *${pteroConfig.sellers.length}* seller\n\n`
        pteroConfig.sellers.forEach((s, i) => {
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
    
    if (cmd === 'addseller') {
        if (pteroConfig.sellers.includes(targetUser)) {
            return m.reply(`❌ \`${targetUser}\` sudah menjadi seller.`)
        }
        
        pteroConfig.sellers.push(targetUser)
        
        if (saveConfig()) {
            return m.reply(
                `✅ *sᴇʟʟᴇʀ ᴅɪᴛᴀᴍʙᴀʜᴋᴀɴ*\n\n` +
                `> Nomor: \`${targetUser}\`\n` +
                `> Total seller: *${pteroConfig.sellers.length}*`
            )
        } else {
            pteroConfig.sellers = pteroConfig.sellers.filter(s => s !== targetUser)
            return m.reply(`❌ Gagal menyimpan ke config.js`)
        }
    }
    
    if (cmd === 'delseller') {
        if (!pteroConfig.sellers.includes(targetUser)) {
            return m.reply(`❌ \`${targetUser}\` bukan seller.`)
        }
        
        pteroConfig.sellers = pteroConfig.sellers.filter(s => s !== targetUser)
        
        if (saveConfig()) {
            return m.reply(
                `✅ *sᴇʟʟᴇʀ ᴅɪʜᴀᴘᴜs*\n\n` +
                `> Nomor: \`${targetUser}\`\n` +
                `> Total seller: *${pteroConfig.sellers.length}*`
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
