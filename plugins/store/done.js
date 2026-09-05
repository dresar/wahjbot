const pluginConfig = {
    name: 'done',
    alias: ['selesai', 'completed'],
    category: 'store',
    description: 'Konfirmasi pembelian selesai',
    usage: '.done (reply pesan buyer)',
    example: '.done',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    limit: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const quoted = m.quoted
    
    if (!quoted) {
        return m.reply(
            `✅ *ᴅᴏɴᴇ / sᴇʟᴇsᴀɪ*\n\n` +
            `> Reply pesan buyer untuk konfirmasi pembelian selesai\n\n` +
            `\`${m.prefix}done\``
        )
    }
    
    const buyerName = quoted.pushName || 'Buyer'
    const timestamp = new Date().toLocaleString('id-ID', { 
        dateStyle: 'medium', 
        timeStyle: 'short' 
    })
    
    m.react('✅')
    
    const doneText = 
        `╭──────────────────────╮\n` +
        `│   ✅ *ᴘᴇᴍʙᴇʟɪᴀɴ sᴇʟᴇsᴀɪ*\n` +
        `├──────────────────────┤\n` +
        `│ 👤 Buyer: ${buyerName}\n` +
        `│ 📅 Waktu: ${timestamp}\n` +
        `│ 🏷️ Status: *COMPLETED*\n` +
        `├──────────────────────┤\n` +
        `│ Terima kasih sudah order!\n` +
        `│ Jangan lupa testimoni ya 🙏\n` +
        `╰──────────────────────╯\n\n` +
        `> _Powered by Ourin Store_`
    
    return sock.sendMessage(m.chat, { text: doneText }, { quoted: quoted })
}

module.exports = {
    config: pluginConfig,
    handler
}
