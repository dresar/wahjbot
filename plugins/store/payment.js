const config = require('../../config')

const pluginConfig = {
    name: 'payment',
    alias: ['bayar', 'pay', 'rekening', 'rek'],
    category: 'store',
    description: 'Tampilkan metode pembayaran',
    usage: '.payment',
    example: '.payment',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const payments = config.store?.payment || []
    
    if (payments.length === 0) {
        return m.reply(
            `💳 *ᴍᴇᴛᴏᴅᴇ ᴘᴇᴍʙᴀʏᴀʀᴀɴ*\n\n` +
            `> Belum ada metode pembayaran yang dikonfigurasi\n\n` +
            `> Owner dapat menambahkan di \`config.js\`:\n` +
            `\`\`\`\nstore: {\n  payment: [\n    { name: 'Dana', number: '08xxx', holder: 'Nama' }\n  ]\n}\n\`\`\``
        )
    }
    
    let txt = `💳 *ᴍᴇᴛᴏᴅᴇ ᴘᴇᴍʙᴀʏᴀʀᴀɴ*\n\n`
    txt += `╭─「 💰 *ᴘɪʟɪʜᴀɴ* 」\n`
    
    for (const pay of payments) {
        txt += `┃\n`
        txt += `┃ 🏦 *${pay.name}*\n`
        txt += `┃ └ 📱 ${pay.number}\n`
        txt += `┃ └ 👤 a/n ${pay.holder}\n`
    }
    
    txt += `┃\n`
    txt += `╰───────────────\n\n`
    txt += `> Setelah transfer, kirim bukti pembayaran\n`
    txt += `> Konfirmasi ke owner untuk proses order`
    
    m.react('💳')
    
    await sock.sendMessage(m.chat, {
        text: txt,
        contextInfo: {
            externalAdReply: {
                title: 'Metode Pembayaran',
                body: config.bot?.name || 'Ourin Store',
                mediaType: 1
            }
        }
    }, { quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler
}
