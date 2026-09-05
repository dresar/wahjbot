const axios = require('axios')
const crypto = require('crypto')
const config = require('../../config')
const { isLid, lidToJid } = require('../../src/lib/lidHelper')

const pluginConfig = {
    name: '1gb',
    alias: ['2gb', '3gb', '4gb', '5gb', '6gb', '7gb', '8gb', '9gb', '10gb', 'unli', 'unlimited'],
    category: 'panel',
    description: 'Create server panel dengan spesifikasi RAM',
    usage: '.1gb [s1/s2/s3] username atau .1gb username,nomor',
    example: '.1gb myserver atau .1gb s2 myserver,628xxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    limit: 0,
    isEnabled: true
}

const RAM_SPECS = {
    '1gb': { ram: 1000, cpu: 70, disk: 1000 },
    '2gb': { ram: 2000, cpu: 80, disk: 1500 },
    '3gb': { ram: 3000, cpu: 90, disk: 2000 },
    '4gb': { ram: 4000, cpu: 100, disk: 2500 },
    '5gb': { ram: 5000, cpu: 110, disk: 3000 },
    '6gb': { ram: 6000, cpu: 120, disk: 3500 },
    '7gb': { ram: 7000, cpu: 130, disk: 4000 },
    '8gb': { ram: 8000, cpu: 140, disk: 4500 },
    '9gb': { ram: 9000, cpu: 150, disk: 5000 },
    '10gb': { ram: 10000, cpu: 160, disk: 5500 },
    'unli': { ram: 0, cpu: 0, disk: 0 },
    'unlimited': { ram: 0, cpu: 0, disk: 0 }
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

function hasAccess(senderJid, isOwner, pteroConfig) {
    if (isOwner) return true
    const cleanSender = cleanJid(senderJid)?.split('@')[0]
    if (!cleanSender) return false
    const sellers = pteroConfig?.sellers || []
    const ownerPanels = pteroConfig?.ownerPanels || []
    return sellers.includes(cleanSender) || ownerPanels.includes(cleanSender)
}

function getServerConfig(pteroConfig, serverKey) {
    const serverConfigs = {
        's1': pteroConfig.server1,
        's2': pteroConfig.server2,
        's3': pteroConfig.server3,
        'server1': pteroConfig.server1,
        'server2': pteroConfig.server2,
        'server3': pteroConfig.server3
    }
    return serverConfigs[serverKey] || pteroConfig.server1
}

function validateServerConfig(serverConfig) {
    const missing = []
    if (!serverConfig?.domain) missing.push('domain')
    if (!serverConfig?.apikey) missing.push('apikey (PTLA)')
    return missing
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
    
    if (!hasAccess(m.sender, m.isOwner, pteroConfig)) {
        return m.reply(`❌ *ᴀᴋsᴇs ᴅɪᴛᴏʟᴀᴋ*\n\n> Fitur ini hanya untuk Owner, Owner Panel, atau Seller.`)
    }
    
    const args = m.text?.trim().split(' ') || []
    let serverKey = 's1'
    let restArgs = args
    
    if (args[0] && ['s1', 's2', 's3', 'server1', 'server2', 'server3'].includes(args[0].toLowerCase())) {
        serverKey = args[0].toLowerCase()
        restArgs = args.slice(1)
    }
    
    const serverConfig = getServerConfig(pteroConfig, serverKey)
    const missingConfig = validateServerConfig(serverConfig)
    
    if (missingConfig.length > 0) {
        const available = getAvailableServers(pteroConfig)
        let txt = `⚠️ *sᴇʀᴠᴇʀ ${serverKey.toUpperCase()} ʙᴇʟᴜᴍ ᴋᴏɴꜰɪɢ*\n\n`
        if (available.length > 0) {
            txt += `> Server tersedia: *${available.join(', ')}*\n`
            txt += `> Contoh: \`${m.prefix}${m.command} ${available[0]} username\``
        } else {
            txt += `> Isi config pterodactyl di \`config.js\``
        }
        return m.reply(txt)
    }
    
    let targetUser = null
    let username = null
    const argStr = restArgs.join(' ')
    
    if (argStr.includes(',')) {
        const parts = argStr.split(',')
        username = parts[0]?.trim().toLowerCase()
        let nomor = parts[1]?.trim().replace(/[^0-9]/g, '')
        if (nomor) targetUser = nomor + '@s.whatsapp.net'
    } else if (argStr) {
        username = argStr.trim().toLowerCase()
    }
    
    if (!username) {
        const available = getAvailableServers(pteroConfig)
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}${m.command} username\`\n` +
            `> \`${m.prefix}${m.command} username,628xxx\`\n` +
            `> \`${m.prefix}${m.command} s2 username\` (server 2)\n\n` +
            `> Server tersedia: *${available.join(', ') || 'none'}*`
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
    } catch (e) {
        return m.reply(`❌ Gagal validasi nomor WhatsApp.`)
    }
    
    const specs = RAM_SPECS[m.command]
    if (!specs) {
        return m.reply(`❌ Paket tidak ditemukan.`)
    }
    
    const email = `${username}@ourin.md`
    const name = capitalize(username) + ' Server'
    const password = username + crypto.randomBytes(3).toString('hex')
    const serverLabel = serverKey.replace('server', 'S').toUpperCase()
    
    await m.reply(`🛠️ *ᴍᴇᴍʙᴜᴀᴛ ᴀᴋᴜɴ ᴘᴀɴᴇʟ...*\n\n> Server: *${serverLabel}*\n> Username: \`${username}\`\n> Target: \`${targetUser.split('@')[0]}\``)
    
    try {
        const userRes = await axios.post(`${serverConfig.domain}/api/application/users`, {
            email,
            username,
            first_name: name,
            last_name: 'Panel',
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
        
        const eggRes = await axios.get(`${serverConfig.domain}/api/application/nests/${serverConfig.nestid}/eggs/${serverConfig.egg}`, {
            headers: {
                'Authorization': `Bearer ${serverConfig.apikey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        })
        
        const startupCmd = eggRes.data.attributes.startup
        
        const serverRes = await axios.post(`${serverConfig.domain}/api/application/servers`, {
            name,
            description: `Created at ${formatDate()} [${serverLabel}]`,
            user: user.id,
            egg: parseInt(serverConfig.egg),
            docker_image: 'ghcr.io/parkervcp/yolks:nodejs_18',
            startup: startupCmd,
            environment: {
                INST: 'npm',
                USER_UPLOAD: '0',
                AUTO_UPDATE: '0',
                CMD_RUN: 'npm start'
            },
            limits: {
                memory: specs.ram,
                swap: 0,
                disk: specs.disk,
                io: 500,
                cpu: specs.cpu
            },
            feature_limits: {
                databases: 5,
                backups: 5,
                allocations: 5
            },
            deploy: {
                locations: [parseInt(serverConfig.location)],
                dedicated_ip: false,
                port_range: []
            }
        }, {
            headers: {
                'Authorization': `Bearer ${serverConfig.apikey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        })
        
        const server = serverRes.data.attributes
        
        const ramLabel = specs.ram === 0 ? 'Unlimited' : `${specs.ram / 1000} GB`
        const cpuLabel = specs.cpu === 0 ? 'Unlimited' : `${specs.cpu}%`
        const diskLabel = specs.disk === 0 ? 'Unlimited' : `${specs.disk / 1000} GB`
        
        let detailTxt = `✅ *ᴘᴀɴᴇʟ ʙᴇʀʜᴀsɪʟ ᴅɪʙᴜᴀᴛ*\n\n`
        detailTxt += `╭─「 📋 *ᴅᴇᴛᴀɪʟ ᴀᴋᴜɴ* 」\n`
        detailTxt += `┃ 🖥️ \`sᴇʀᴠᴇʀ\`: *${serverLabel}*\n`
        detailTxt += `┃ 👤 \`ᴜsᴇʀɴᴀᴍᴇ\`: *${user.username}*\n`
        detailTxt += `┃ 🔐 \`ᴘᴀssᴡᴏʀᴅ\`: *${password}*\n`
        detailTxt += `┃ 🆔 \`sᴇʀᴠᴇʀ ɪᴅ\`: *${server.id}*\n`
        detailTxt += `┃ 🗓️ \`ᴛᴀɴɢɢᴀʟ\`: *${formatDate()}*\n`
        detailTxt += `╰───────────────\n\n`
        detailTxt += `╭─「 🧠 *sᴘᴇsɪꜰɪᴋᴀsɪ* 」\n`
        detailTxt += `┃ 💾 \`ʀᴀᴍ\`: *${ramLabel}*\n`
        detailTxt += `┃ ⚡ \`ᴄᴘᴜ\`: *${cpuLabel}*\n`
        detailTxt += `┃ 📦 \`ᴅɪsᴋ\`: *${diskLabel}*\n`
        detailTxt += `╰───────────────\n\n`
        detailTxt += `🌐 *ʟᴏɢɪɴ ᴘᴀɴᴇʟ:* ${serverConfig.domain}\n\n`
        detailTxt += `> ⚠️ Simpan data ini baik-baik!\n`
        detailTxt += `> ⚠️ Jangan bagikan ke siapapun!`
        
        await sock.sendMessage(targetUser, { text: detailTxt })
        await m.reply(`✅ *ᴘᴀɴᴇʟ ʙᴇʀʜᴀsɪʟ ᴅɪʙᴜᴀᴛ*\n\n> Server: *${serverLabel}*\n> Data telah dikirim ke \`${targetUser.split('@')[0]}\``)
    } catch (err) {
        const errMsg = err?.response?.data?.errors?.[0]?.detail || err.message
        return m.reply(`❌ *ɢᴀɢᴀʟ ᴍᴇᴍʙᴜᴀᴛ ᴘᴀɴᴇʟ*\n\n> ${errMsg}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
