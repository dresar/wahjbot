const axios = require('axios')
const config = require('../../config')
const { isLid, lidToJid } = require('../../src/lib/lidHelper')

const pluginConfig = {
    name: 'delserver',
    alias: ['deleteserver', 'hapusserver'],
    category: 'panel',
    description: 'Hapus server dari panel',
    usage: '.delserver serverid',
    example: '.delserver 5',
    isOwner: false,
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

function hasAccess(senderJid, isOwner, pteroConfig) {
    if (isOwner) return true
    const cleanSender = cleanJid(senderJid)?.split('@')[0]
    if (!cleanSender) return false
    const ownerPanels = pteroConfig?.ownerPanels || []
    return ownerPanels.includes(cleanSender)
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
        's3': pteroConfig.server3,
        'server1': pteroConfig.server1,
        'server2': pteroConfig.server2,
        'server3': pteroConfig.server3
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
    
    if (!hasAccess(m.sender, m.isOwner, pteroConfig)) {
        return m.reply(`❌ *ᴀᴋsᴇs ᴅɪᴛᴏʟᴀᴋ*\n\n> Fitur ini hanya untuk Owner atau Owner Panel.`)
    }
    
    const args = m.text?.trim().split(' ') || []
    let serverKey = 's1'
    let serverId = null
    
    if (args[0] && ['s1', 's2', 's3', 'server1', 'server2', 'server3'].includes(args[0].toLowerCase())) {
        serverKey = args[0].toLowerCase()
        serverId = args[1]
    } else {
        serverId = args[0]
    }
    
    const serverConfig = getServerConfig(pteroConfig, serverKey)
    const missingConfig = validateConfig(serverConfig)
    
    if (missingConfig.length > 0) {
        const available = getAvailableServers(pteroConfig)
        let txt = `⚠️ *sᴇʀᴠᴇʀ ${serverKey.toUpperCase()} ʙᴇʟᴜᴍ ᴋᴏɴꜰɪɢ*\n\n`
        if (available.length > 0) {
            txt += `> Server tersedia: *${available.join(', ')}*\n`
            txt += `> Contoh: \`${m.prefix}delserver ${available[0]} serverid\``
        } else {
            txt += `> Isi config pterodactyl di \`config.js\``
        }
        return m.reply(txt)
    }
    
    if (!serverId || isNaN(serverId)) {
        const available = getAvailableServers(pteroConfig)
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}delserver serverid\`\n` +
            `> \`${m.prefix}delserver s2 serverid\` (server 2)\n\n` +
            `> Server tersedia: *${available.join(', ') || 'none'}*\n` +
            `> Lihat server ID dengan \`${m.prefix}listserver\``
        )
    }
    
    try {
        const serverRes = await axios.get(`${serverConfig.domain}/api/application/servers/${serverId}`, {
            headers: {
                'Authorization': `Bearer ${serverConfig.apikey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        })
        
        const server = serverRes.data.attributes
        const serverLabel = serverKey.replace('server', 'S').toUpperCase()
        
        await axios.delete(`${serverConfig.domain}/api/application/servers/${serverId}`, {
            headers: {
                'Authorization': `Bearer ${serverConfig.apikey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        })
        
        return m.reply(
            `✅ *sᴇʀᴠᴇʀ ᴅɪʜᴀᴘᴜs*\n\n` +
            `> Panel: *${serverLabel}*\n` +
            `> Server ID: \`${serverId}\`\n` +
            `> Nama: \`${server.name}\``
        )
        
    } catch (err) {
        const errMsg = err?.response?.data?.errors?.[0]?.detail || err.message
        return m.reply(`❌ *ɢᴀɢᴀʟ ᴍᴇɴɢʜᴀᴘᴜs sᴇʀᴠᴇʀ*\n\n> ${errMsg}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
