const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'listadmin',
    alias: ['adminlist', 'admins'],
    category: 'panel',
    description: 'List semua admin panel',
    usage: '.listadmin',
    example: '.listadmin',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
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
    
    try {
        const res = await axios.get(`${serverConfig.domain}/api/application/users`, {
            headers: {
                'Authorization': `Bearer ${serverConfig.apikey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        })
        
        const users = res.data.data || []
        const admins = users.filter(u => u.attributes.root_admin)
        
        if (admins.length === 0) {
            return m.reply(`📋 *ᴅᴀꜰᴛᴀʀ ᴀᴅᴍɪɴ ᴘᴀɴᴇʟ*\n\n> Tidak ada admin terdaftar.`)
        }
        
        let txt = `📋 *ᴅᴀꜰᴛᴀʀ ᴀᴅᴍɪɴ ᴘᴀɴᴇʟ*\n\n`
        txt += `> Total: *${admins.length}* admin\n\n`
        
        admins.forEach((u, i) => {
            const attr = u.attributes
            txt += `${i + 1}. *${attr.username}*\n`
            txt += `   └ ID: \`${attr.id}\` | Email: \`${attr.email}\`\n`
        })
        
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
