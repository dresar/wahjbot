const config = require('../../config')

const pluginConfig = {
    name: 'cpanel',
    alias: ['panelmenu', 'menupanel'],
    category: 'panel',
    description: 'Menu panel pterodactyl',
    usage: '.cpanel',
    example: '.cpanel',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const pteroConfig = config.pterodactyl
    const prefix = m.prefix || '.'
    
    const server1 = pteroConfig?.server1
    const hasConfig = server1?.domain && server1?.apikey
    const configStatus = hasConfig ? '✅ Configured' : '❌ Not configured'
    const sellerCount = pteroConfig?.sellers?.length || 0
    const ownerPanelCount = pteroConfig?.ownerPanels?.length || 0
    
    let txt = `🖥️ *ᴄᴘᴀɴᴇʟ ᴍᴇɴᴜ*\n\n`
    txt += `> Panel: *${configStatus}*\n`
    txt += `> Your Role: *${pteroConfig.ownerPanels?.includes(m.sender) ? 'Owner' : pteroConfig.sellers?.includes(m.sender) ? 'Seller' : 'Gak ada'}*\n`
    txt += `> Sellers: *${sellerCount}*\n`
    txt += `> Owner Panel: *${ownerPanelCount}*\n\n`
    
    txt += `╭─「 📦 *ᴄʀᴇᴀᴛᴇ sᴇʀᴠᴇʀ* 」\n`
    txt += `┃ \`${prefix}1gb\`\n`
    txt += `┃ \`${prefix}2gb\`\n`
    txt += `┃ \`${prefix}3gb\`\n`
    txt += `┃ \`${prefix}4gb\`\n`
    txt += `┃ \`${prefix}5gb\`\n`
    txt += `┃ \`${prefix}6gb\`\n`
    txt += `┃ \`${prefix}7gb\`\n`
    txt += `┃ \`${prefix}8gb\`\n`
    txt += `┃ \`${prefix}9gb\`\n`
    txt += `┃ \`${prefix}10gb\`\n`
    txt += `┃ \`${prefix}unli\`\n`
    txt += `┃ Format: username atau username,nomor\n`
    txt += `╰───────────────\n\n`
    
    txt += `╭─「 👥 *sᴇʟʟᴇʀ ᴍᴀɴᴀɢᴇᴍᴇɴᴛ* 」\n`
    txt += `┃ \`${prefix}addseller\`\n`
    txt += `┃ \`${prefix}delseller\`\n`
    txt += `┃ \`${prefix}listseller\`\n`
    txt += `╰───────────────\n\n`
    
    txt += `╭─「 👑 *ᴏᴡɴᴇʀ ᴘᴀɴᴇʟ* 」\n`
    txt += `┃ \`${prefix}addownpanel\`\n`
    txt += `┃ \`${prefix}delownpanel\`\n`
    txt += `┃ \`${prefix}listownpanel\`\n`
    txt += `╰───────────────\n\n`
    
    txt += `╭─「 🔐 *ᴀᴅᴍɪɴ ᴘᴀɴᴇʟ* 」\n`
    txt += `┃ \`${prefix}cadmin\`\n`
    txt += `┃ \`${prefix}deladmin\`\n`
    txt += `┃ \`${prefix}listadmin\`\n`
    txt += `╰───────────────\n\n`
    
    txt += `╭─「 🖥️ *sᴇʀᴠᴇʀ ᴍᴀɴᴀɢᴇᴍᴇɴᴛ* 」\n`
    txt += `┃ \`${prefix}listserver\`\n`
    txt += `┃ \`${prefix}delserver\`\n`
    txt += `┃ \`${prefix}serverinfo\`\n`
    txt += `╰───────────────\n\n`
    
    txt += `> _Powered by ${config.info.website}_`
    
    await m.reply(txt)
}

module.exports = {
    config: pluginConfig,
    handler
}
