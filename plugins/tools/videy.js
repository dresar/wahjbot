const videy = require('../../src/scraper/videy')
const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'videy',
    alias: ['vidl', 'tovidey'],
    category: 'tools',
    description: 'Upload video ke Videy.co',
    usage: '.videy (reply video)',
    example: '.videy (reply video)',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    limit: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    let downloadFn = null
    
    if (m.quoted?.isVideo || m.quoted?.message?.videoMessage) {
        downloadFn = m.quoted.download
    } else if (m.isVideo || m.message?.videoMessage) {
        downloadFn = m.download
    }
    
    if (!downloadFn) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> Reply video dengan \`${m.prefix}vidl\`\n` +
            `> Atau kirim video dengan caption \`${m.prefix}vidl\``
        )
    }
    
    await m.reply(`⏳ *ᴍᴇɴɢᴜᴘʟᴏᴀᴅ ᴋᴇ ᴠɪᴅᴇʏ...*`)
    
    const tempDir = path.join(process.cwd(), 'temp')
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true })
    }
    
    const tempFile = path.join(tempDir, `videy_${Date.now()}.mp4`)
    
    try {
        const buffer = await downloadFn()
        fs.writeFileSync(tempFile, buffer)
        
        const result = await videy(tempFile)
        
        fs.unlinkSync(tempFile)
        
        if (result.status === 'error' || !result.output?.id) {
            return m.reply(`❌ *ɢᴀɢᴀʟ ᴜᴘʟᴏᴀᴅ*\n\n> ${result.msg || 'Unknown error'}`)
        }
        
        const videoLink = result.output.link || `https://videy.co/v/?id=${result.output.id}`
        
        await m.reply(
            `✅ *ᴠɪᴅᴇʏ ᴜᴘʟᴏᴀᴅᴇʀ*\n\n` +
            `> 🆔 ID: \`${result.output.id}\`\n` +
            `> 🔗 Link: ${videoLink}`
        )
        
    } catch (err) {
        if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile)
        }
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
