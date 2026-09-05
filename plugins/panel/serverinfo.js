const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'serverinfo',
    alias: ['infoserver', 'sinfo'],
    category: 'panel',
    description: 'Info detail server',
    usage: '.serverinfo [s1/s2/s3] serverid',
    example: '.serverinfo 5 atau .serverinfo s2 5',
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

async function handler(m, { sock }) {
    const pteroConfig = config.pterodactyl
    
    const args = m.text?.trim().split(' ') || []
    let serverKey = 's1'
    let serverId = args[0]
    
    if (args[0] && ['s1', 's2', 's3'].includes(args[0].toLowerCase())) {
        serverKey = args[0].toLowerCase()
        serverId = args[1]
    }
    
    const serverConfig = getServerConfig(pteroConfig, serverKey)
    const missingConfig = validateServerConfig(serverConfig)
    
    if (missingConfig.length > 0) {
        const available = getAvailableServers(pteroConfig)
        let txt = `⚠️ *sᴇʀᴠᴇʀ ${serverKey.toUpperCase()} ʙᴇʟᴜᴍ ᴋᴏɴꜰɪɢ*\n\n`
        if (available.length > 0) {
            txt += `> Server tersedia: *${available.join(', ')}*`
        }
        return m.reply(txt)
    }
    
    const serverLabel = serverKey.toUpperCase()
    
    if (!serverId || isNaN(serverId)) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}serverinfo serverid\`\n` +
            `> \`${m.prefix}serverinfo s2 serverid\`\n\n` +
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
        
        const s = serverRes.data.attributes
        const limits = s.limits || {}
        const features = s.feature_limits || {}
        
        let txt = `📊 *ɪɴꜰᴏ sᴇʀᴠᴇʀ [${serverLabel}]*\n\n`
        txt += `╭─「 📋 *ᴅᴇᴛᴀɪʟ* 」\n`
        txt += `┃ 🆔 \`ɪᴅ\`: *${s.id}*\n`
        txt += `┃ 📛 \`ɴᴀᴍᴀ\`: *${s.name}*\n`
        txt += `┃ 👤 \`ᴏᴡɴᴇʀ ɪᴅ\`: *${s.user}*\n`
        txt += `┃ 📝 \`ᴅᴇsᴋʀɪᴘsɪ\`: *${s.description || '-'}*\n`
        txt += `┃ 📊 \`sᴛᴀᴛᴜs\`: *${s.suspended ? '⛔ Suspended' : '✅ Active'}*\n`
        txt += `╰───────────────\n\n`
        txt += `╭─「 🧠 *sᴘᴇsɪꜰɪᴋᴀsɪ* 」\n`
        txt += `┃ 💾 \`ʀᴀᴍ\`: *${formatBytes(limits.memory)}*\n`
        txt += `┃ ⚡ \`ᴄᴘᴜ\`: *${limits.cpu === 0 ? 'Unlimited' : limits.cpu + '%'}*\n`
        txt += `┃ 📦 \`ᴅɪsᴋ\`: *${formatBytes(limits.disk)}*\n`
        txt += `┃ 🔄 \`sᴡᴀᴘ\`: *${limits.swap} MB*\n`
        txt += `╰───────────────\n\n`
        txt += `╭─「 📦 *ꜰᴇᴀᴛᴜʀᴇ ʟɪᴍɪᴛs* 」\n`
        txt += `┃ 🗄️ \`ᴅᴀᴛᴀʙᴀsᴇ\`: *${features.databases}*\n`
        txt += `┃ 💾 \`ʙᴀᴄᴋᴜᴘ\`: *${features.backups}*\n`
        txt += `┃ 🔌 \`ᴀʟʟᴏᴄᴀᴛɪᴏɴs\`: *${features.allocations}*\n`
        txt += `╰───────────────`
        
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
