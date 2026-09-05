const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'listserver',
    alias: ['servers', 'serverlist'],
    category: 'panel',
    description: 'List semua server di panel',
    usage: '.listserver [s1/s2/s3]',
    example: '.listserver atau .listserver s2',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
}

function getServerConfig(pteroConfig, serverKey) {
    const serverConfigs = {
        's1': pteroConfig.server1,
        's2': pteroConfig.server2,
        's3': pteroConfig.server3
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

function formatBytes(bytes) {
    if (bytes === 0) return 'Unlimited'
    const mb = bytes
    if (mb >= 1000) return `${(mb / 1000).toFixed(1)} GB`
    return `${mb} MB`
}

async function fetchAllServers(serverConfig) {
    let allServers = []
    let page = 1
    let totalPages = 1
    
    while (page <= totalPages) {
        const res = await axios.get(`${serverConfig.domain}/api/application/servers?page=${page}&per_page=50`, {
            headers: {
                'Authorization': `Bearer ${serverConfig.apikey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        })
        
        const servers = res.data.data || []
        allServers = allServers.concat(servers)
        
        const meta = res.data.meta?.pagination
        if (meta) {
            totalPages = meta.total_pages || 1
        }
        page++
    }
    
    return allServers
}

async function handler(m, { sock }) {
    const pteroConfig = config.pterodactyl
    const args = m.text?.trim().toLowerCase() || ''
    
    let serverKey = 's1'
    if (['s1', 's2', 's3'].includes(args)) {
        serverKey = args
    }
    
    const serverConfig = getServerConfig(pteroConfig, serverKey)
    const missingConfig = validateServerConfig(serverConfig)
    
    if (missingConfig.length > 0) {
        const available = getAvailableServers(pteroConfig)
        let txt = `⚠️ *sᴇʀᴠᴇʀ ${serverKey.toUpperCase()} ʙᴇʟᴜᴍ ᴋᴏɴꜰɪɢ*\n\n`
        if (available.length > 0) {
            txt += `> Server tersedia: *${available.join(', ')}*\n`
            txt += `> Contoh: \`${m.prefix}listserver ${available[0]}\``
        } else {
            txt += `> Isi config pterodactyl di \`config.js\``
        }
        return m.reply(txt)
    }
    
    try {
        await m.reply(`⏳ Mengambil daftar server dari *${serverKey.toUpperCase()}*...`)
        
        const servers = await fetchAllServers(serverConfig)
        const serverLabel = serverKey.toUpperCase()
        
        if (servers.length === 0) {
            return m.reply(`📋 *ᴅᴀꜰᴛᴀʀ sᴇʀᴠᴇʀ [${serverLabel}]*\n\n> Tidak ada server terdaftar.`)
        }
        
        let txt = `📋 *ᴅᴀꜰᴛᴀʀ sᴇʀᴠᴇʀ [${serverLabel}]*\n\n`
        txt += `> Total: *${servers.length}* server\n\n`
        
        servers.slice(0, 20).forEach((s, i) => {
            const attr = s.attributes
            const limits = attr.limits || {}
            txt += `${i + 1}. *${attr.name}*\n`
            txt += `   ├ ID: \`${attr.id}\`\n`
            txt += `   ├ RAM: \`${formatBytes(limits.memory)}\`\n`
            txt += `   └ CPU: \`${limits.cpu === 0 ? 'Unlimited' : limits.cpu + '%'}\`\n`
        })
        
        if (servers.length > 20) {
            txt += `\n> ... dan ${servers.length - 20} server lainnya`
        }
        
        const available = getAvailableServers(pteroConfig)
        if (available.length > 1) {
            txt += `\n\n> Server lain: *${available.filter(s => s !== serverKey).join(', ')}*`
        }
        
        return m.reply(txt)
        
    } catch (err) {
        const errMsg = err?.response?.data?.errors?.[0]?.detail || err.message
        return m.reply(`❌ *ɢᴀɢᴀʟ ᴍᴇɴɢᴀᴍʙɪʟ ᴅᴀᴛᴀ*\n\n> ${errMsg}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
