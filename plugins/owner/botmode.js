const config = require('../../config')
const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'botmode',
    alias: ['setmode', 'mode'],
    category: 'owner',
    description: 'Mengatur mode bot (md/cpanel/store/pushkontak/all)',
    usage: '.botmode <mode>',
    example: '.botmode all',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    limit: 0,
    isEnabled: true
}

const VALID_MODES = ['md', 'cpanel', 'store', 'pushkontak', 'all']

const MODE_DESCRIPTIONS = {
    md: 'Mode default, semua fitur kecuali panel/store/pushkontak',
    cpanel: 'Mode panel, main + group + sticker + owner + tools + panel',
    store: 'Mode store, main + group + sticker + owner + store',
    pushkontak: 'Mode pushkontak, main + group + sticker + owner + pushkontak',
    all: 'Mode full, SEMUA fitur dari semua mode bisa diakses'
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []
    const mode = args[0]?.toLowerCase()
    
    const globalMode = db.setting('botMode') || 'md'
    const groupData = m.isGroup ? (db.getGroup(m.chat) || {}) : {}
    const currentMode = m.isGroup ? (groupData.botMode || globalMode) : globalMode
    
    if (!mode) {
        let txt = `╭┈┈⬡「 🤖 *ʙᴏᴛ ᴍᴏᴅᴇ* 」
┃ ㊗ ɢʟᴏʙᴀʟ: *${globalMode.toUpperCase()}*
${m.isGroup ? `┃ ㊗ ɢʀᴜᴘ: *${(groupData.botMode || globalMode).toUpperCase()}*\n` : ''}╰┈┈⬡

╭┈┈⬡「 📋 *ᴀᴠᴀɪʟᴀʙʟᴇ ᴍᴏᴅᴇs* 」
`
        for (const [key, desc] of Object.entries(MODE_DESCRIPTIONS)) {
            const isActive = key === currentMode ? ' ✅' : ''
            txt += `┃ ㊗ *${key.toUpperCase()}*${isActive}\n`
            txt += `┃   ${desc}\n`
        }
        txt += `╰┈┈⬡

> \`${m.prefix}botmode md\` → Mode default
> \`${m.prefix}botmode all\` → Semua fitur`
        
        await m.reply(txt)
        return
    }
    
    if (!VALID_MODES.includes(mode)) {
        return m.reply(
            `❌ *ᴍᴏᴅᴇ ᴛɪᴅᴀᴋ ᴠᴀʟɪᴅ*\n\n` +
            `> Mode tersedia: \`${VALID_MODES.join(', ')}\``
        )
    }
    
    if (mode === currentMode) {
        return m.reply(`ℹ️ Bot sudah dalam mode *${mode.toUpperCase()}*`)
    }
    
    db.setting('botMode', mode)
    
    if (m.isGroup) {
        db.setGroup(m.chat, { ...groupData, botMode: mode })
    }
    
    m.react('✅')
    await m.reply(
        `✅ *ᴍᴏᴅᴇ ᴅɪᴜʙᴀʜ*\n\n` +
        `> Mode: *${mode.toUpperCase()}*\n` +
        `> ${MODE_DESCRIPTIONS[mode]}\n\n` +
        (m.isGroup ? `> _Mode grup ini juga diubah._` : `> _Mode global diubah._`)
    )
    
    console.log(`[BotMode] Changed to ${mode.toUpperCase()} by ${m.pushName} (${m.sender})`)
}

module.exports = {
    config: pluginConfig,
    handler,
    VALID_MODES,
    MODE_DESCRIPTIONS
}
