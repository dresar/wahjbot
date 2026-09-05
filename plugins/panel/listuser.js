const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'listuser',
    alias: ['users', 'userlist', 'listpanel'],
    category: 'panel',
    description: 'List semua user di panel',
    usage: '.listuser [s1/s2/s3]',
    example: '.listuser atau .listuser s2',
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
            txt += `> Contoh: \`${m.prefix}listuser ${available[0]}\``
        } else {
            txt += `> Isi config pterodactyl di \`config.js\``
        }
        return m.reply(txt)
    }
    
    try {
        const res = await axios.get(`${serverConfig.domain}/api/application/users?per_page=100`, {
            headers: {
                'Authorization': `Bearer ${serverConfig.apikey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        })
        
        const users = res.data.data || []
        const serverLabel = serverKey.toUpperCase()
        
        if (users.length === 0) {
            return m.reply(`📋 *ᴅᴀꜰᴛᴀʀ ᴜsᴇʀ [${serverLabel}]*\n\n> Tidak ada user terdaftar.`)
        }
        
        let txt = `📋 *ᴅᴀꜰᴛᴀʀ ᴜsᴇʀ [${serverLabel}]*\n\n`
        txt += `> Total: *${users.length}* user\n\n`
        
        users.slice(0, 20).forEach((u, i) => {
            const attr = u.attributes
            const isAdmin = attr.root_admin ? ' 👑' : ''
            txt += `${i + 1}. *${attr.username}*${isAdmin}\n`
            txt += `   ├ ID: \`${attr.id}\`\n`
            txt += `   └ Email: \`${attr.email}\`\n`
        })
        
        if (users.length > 20) {
            txt += `\n> ... dan ${users.length - 20} user lainnya`
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
