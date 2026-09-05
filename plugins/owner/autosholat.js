const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'autosholat',
    alias: ['sholat', 'jadwalsholat'],
    category: 'owner',
    description: 'Toggle pengingat waktu sholat otomatis (global)',
    usage: '.autosholat on/off',
    example: '.autosholat on',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
}

async function handler(m, { sock, db }) {
    const args = m.args[0]?.toLowerCase()
    
    if (!['on', 'off'].includes(args)) {
        const status = db.setting('autoSholat') ? '✅ Aktif' : '❌ Nonaktif'
        return m.reply(`🕌 *ᴀᴜᴛᴏ sʜᴏʟᴀᴛ (ɢʟᴏʙᴀʟ)*\n\n> Status: ${status}\n\n*Penggunaan:*\n\`${m.prefix}autosholat on\` - Aktifkan\n\`${m.prefix}autosholat off\` - Nonaktifkan\n\n> Fitur ini akan mengirim pengingat sholat ke semua grup yang mengaktifkan .notifsolat on`)
    }
    
    if (args === 'on') {
        db.setting('autoSholat', true)
        return m.reply(`✅ *ᴀᴜᴛᴏ sʜᴏʟᴀᴛ ᴅɪᴀᴋᴛɪꜰᴋᴀɴ*\n\n> Pengingat waktu sholat aktif secara global\n> Untuk wilayah Jakarta (WIB)`)
    }
    
    if (args === 'off') {
        db.setting('autoSholat', false)
        return m.reply(`❌ *ᴀᴜᴛᴏ sʜᴏʟᴀᴛ ᴅɪɴᴏɴᴀᴋᴛɪꜰᴋᴀɴ*`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
