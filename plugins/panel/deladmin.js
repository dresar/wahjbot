const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'deladmin',
    alias: ['deleteadmin', 'hapusadmin'],
    category: 'panel',
    description: 'Hapus admin panel',
    usage: '.deladmin userid',
    example: '.deladmin 5',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
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
    
    const userId = m.text?.trim()
    
    if (!userId || isNaN(userId)) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}deladmin userid\`\n\n` +
            `> Lihat user ID dengan \`${m.prefix}listadmin\``
        )
    }
    
    try {
        const userRes = await axios.get(`${serverConfig.domain}/api/application/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${serverConfig.apikey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        })
        
        const user = userRes.data.attributes
        
        await axios.delete(`${serverConfig.domain}/api/application/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${serverConfig.apikey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        })
        
        return m.reply(
            `✅ *ᴀᴅᴍɪɴ ᴅɪʜᴀᴘᴜs*\n\n` +
            `> User ID: \`${userId}\`\n` +
            `> Username: \`${user.username}\`\n` +
            `> Email: \`${user.email}\``
        )
        
    } catch (err) {
        const errMsg = err?.response?.data?.errors?.[0]?.detail || err.message
        return m.reply(`❌ *ɢᴀɢᴀʟ ᴍᴇɴɢʜᴀᴘᴜs ᴀᴅᴍɪɴ*\n\n> ${errMsg}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
