const axios = require('axios')
const crypto = require('crypto')
const config = require('../../config')
const { isLid, lidToJid } = require('../../src/lib/lidHelper')

const pluginConfig = {
    name: 'cadmin',
    alias: ['createadmin'],
    category: 'panel',
    description: 'Buat admin panel baru',
    usage: '.cadmin username atau .cadmin username,nomor',
    example: '.cadmin adminku,628xxx',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    limit: 0,
    isEnabled: true
}

function cleanJid(jid) {
    if (!jid) return null
    if (isLid(jid)) jid = lidToJid(jid)
    return jid.includes('@') ? jid : jid + '@s.whatsapp.net'
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

function formatDate() {
    const now = new Date()
    const options = { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }
    return now.toLocaleDateString('id-ID', options)
}

function validateConfig(serverConfig) {
    const missing = []
    if (!serverConfig?.domain) missing.push('domain')
    if (!serverConfig?.apikey) missing.push('apikey (PTLA)')
    return missing
}

function getServerConfig(pteroConfig, serverKey) {
    const serverConfigs = {
        's1': pteroConfig.server1,
        's2': pteroConfig.server2,
        's3': pteroConfig.server3
    }
    return serverConfigs[serverKey] || pteroConfig.server1
}

function getAvailableServers(pteroConfig) {
    const available = []
    if (pteroConfig.server1?.domain && pteroConfig.server1?.apikey) available.push('s1')
    if (pteroConfig.server2?.domain && pteroConfig.server2?.apikey) available.push('s2')
    if (pteroConfig.server3?.domain && pteroConfig.server3?.apikey) available.push('s3')
    return available
}

async function handler(m, { sock }) {
    const pteroConfig = config.pterodactyl
    const serverConfig = getServerConfig(pteroConfig, 's1')
    
    const missingConfig = validateConfig(serverConfig)
    if (missingConfig.length > 0) {
        const available = getAvailableServers(pteroConfig)
        let txt = `⚠️ *ᴋᴏɴꜰɪɢᴜʀᴀsɪ ʙᴇʟᴜᴍ ʟᴇɴɢᴋᴀᴘ*\n\n`
        if (available.length > 0) {
            txt += `> Server tersedia: *${available.join(', ')}*`
        } else {
            txt += `> Isi di \`config.js\` bagian \`pterodactyl.server1\``
        }
        return m.reply(txt)
    }
    
    let targetUser = null
    let username = null
    const args = m.text?.trim() || ''
    
    if (args.includes(',')) {
        const parts = args.split(',')
        username = parts[0]?.trim().toLowerCase()
        let nomor = parts[1]?.trim().replace(/[^0-9]/g, '')
        if (nomor) targetUser = nomor + '@s.whatsapp.net'
    } else if (args) {
        username = args.trim().toLowerCase()
    }
    
    if (!username) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}cadmin username\`\n` +
            `> \`${m.prefix}cadmin username,628xxx\`\n` +
            `> Reply/mention user untuk kirim ke nomor lain`
        )
    }
    
    if (!/^[a-z0-9_]{3,16}$/.test(username)) {
        return m.reply(`❌ Username hanya boleh huruf kecil, angka, underscore (3-16 karakter).`)
    }
    
    if (!targetUser) {
        if (m.quoted?.sender) {
            targetUser = cleanJid(m.quoted.sender)
        } else if (m.mentionedJid?.length > 0) {
            targetUser = cleanJid(m.mentionedJid[0])
        } else {
            targetUser = cleanJid(m.sender)
        }
    }
    
    if (!targetUser) {
        return m.reply(`❌ Tidak dapat menentukan nomor target.`)
    }
    
    try {
        const [onWa] = await sock.onWhatsApp(targetUser.split('@')[0])
        if (!onWa?.exists) {
            return m.reply(`❌ Nomor \`${targetUser.split('@')[0]}\` tidak terdaftar di WhatsApp!`)
        }
    } catch (e) {}
    
    const email = `${username}@gmail.com`
    const name = capitalize(username) + ' Admin'
    const password = username + crypto.randomBytes(3).toString('hex')
    
    await m.reply(`🛠️ *ᴍᴇᴍʙᴜᴀᴛ ᴀᴅᴍɪɴ ᴘᴀɴᴇʟ...*\n\n> Username: \`${username}\`\n> Target: \`${targetUser.split('@')[0]}\``)
    
    try {
        const userRes = await axios.post(`${serverConfig.domain}/api/application/users`, {
            email,
            username,
            first_name: name,
            last_name: 'Admin',
            root_admin: true,
            language: 'en',
            password
        }, {
            headers: {
                'Authorization': `Bearer ${serverConfig.apikey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        })
        
        const user = userRes.data.attributes
        
        let detailTxt = `✅ *ᴀᴅᴍɪɴ ᴘᴀɴᴇʟ ʙᴇʀʜᴀsɪʟ ᴅɪʙᴜᴀᴛ*\n\n`
        detailTxt += `╭─「 📋 *ᴅᴇᴛᴀɪʟ ᴀᴋᴜɴ* 」\n`
        detailTxt += `┃ 🆔 \`ᴜsᴇʀ ɪᴅ\`: *${user.id}*\n`
        detailTxt += `┃ 👤 \`ᴜsᴇʀɴᴀᴍᴇ\`: *${user.username}*\n`
        detailTxt += `┃ 🔐 \`ᴘᴀssᴡᴏʀᴅ\`: *${password}*\n`
        detailTxt += `┃ 👑 \`sᴛᴀᴛᴜs\`: *Root Admin*\n`
        detailTxt += `┃ 🗓️ \`ᴛᴀɴɢɢᴀʟ\`: *${formatDate()}*\n`
        detailTxt += `╰───────────────\n\n`
        detailTxt += `🌐 *ʟᴏɢɪɴ ᴘᴀɴᴇʟ:* ${serverConfig.domain}\n\n`
        detailTxt += `> ⚠️ Akun ini memiliki akses penuh!\n`
        detailTxt += `> ⚠️ Jangan bagikan ke siapapun!`
        
        await sock.sendMessage(targetUser, { text: detailTxt })
        
        if (targetUser !== m.sender) {
            await m.reply(`✅ *ᴀᴅᴍɪɴ ᴘᴀɴᴇʟ ʙᴇʀʜᴀsɪʟ ᴅɪʙᴜᴀᴛ*\n\n> Data telah dikirim ke \`${targetUser.split('@')[0]}\``)
        }
        
    } catch (err) {
        const errMsg = err?.response?.data?.errors?.[0]?.detail || err.message
        return m.reply(`❌ *ɢᴀɢᴀʟ ᴍᴇᴍʙᴜᴀᴛ ᴀᴅᴍɪɴ*\n\n> ${errMsg}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
