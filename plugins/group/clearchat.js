const pluginConfig = {
    name: 'clearchat',
    alias: ['cc', 'cleargc'],
    category: 'group',
    description: 'Membersihkan chat grup',
    usage: '.clearchat',
    example: '.clearchat',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    isBotAdmin: true,
    cooldown: 60,
    limit: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    m.react('🗑️')
    
    try {
        await sock.chatModify({ delete: true, lastMessages: [{ key: m.key, messageTimestamp: m.messageTimestamp }] }, m.chat)
        
        await sock.sendMessage(m.chat, {
            text: `╭┈┈⬡「 🗑️ *ᴄʟᴇᴀʀ ᴄʜᴀᴛ* 」
┃
┃ ㊗ sᴛᴀᴛᴜs: *Berhasil*
┃ ㊗ ʙʏ: @${m.sender.split('@')[0]}
┃
╰┈┈⬡

> _Chat grup telah dibersihkan!_`,
            mentions: [m.sender]
        })
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
