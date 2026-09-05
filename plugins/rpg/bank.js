const { getDatabase } = require('../../src/lib/database')
const { getRpgContextInfo } = require('../../src/lib/contextHelper')

const pluginConfig = {
    name: 'bank',
    alias: ['atm', 'nabung', 'deposit', 'tarik', 'withdraw'],
    category: 'rpg',
    description: 'Bank system untuk menyimpan uang aman dari rampok',
    usage: '.bank <deposit/withdraw> <jumlah>',
    example: '.bank deposit 10000',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    
    if (!user.rpg) user.rpg = {}
    if (typeof user.rpg.bank !== 'number') user.rpg.bank = 0
    if (typeof user.balance !== 'number') user.balance = 0
    
    const args = m.args || []
    const action = args[0]?.toLowerCase()
    const amountStr = args[1]
    
    if (action === 'deposit' || action === 'depo') {
        let amount = 0
        if (amountStr === 'all') {
            amount = user.balance
        } else {
            amount = parseInt(amountStr)
        }
        
        if (!amount || amount <= 0) return m.reply(`❌ Masukkan jumlah valid!`)
        if (user.balance < amount) return m.reply(`❌ Uang cash tidak cukup!`)
        
        user.balance -= amount
        user.rpg.bank += amount
        
        return m.reply(`✅ Berhasil deposit: Rp ${amount.toLocaleString('id-ID')}\n🏦 Bank: Rp ${user.rpg.bank.toLocaleString('id-ID')}`)
    }
    
    if (action === 'withdraw' || action === 'tarik') {
        let amount = 0
        if (amountStr === 'all') {
            amount = user.rpg.bank
        } else {
            amount = parseInt(amountStr)
        }
        
        if (!amount || amount <= 0) return m.reply(`❌ Masukkan jumlah valid!`)
        if (user.rpg.bank < amount) return m.reply(`❌ Uang di bank tidak cukup!`)
        
        user.rpg.bank -= amount
        user.balance += amount
        
        return m.reply(`✅ Berhasil tarik: Rp ${amount.toLocaleString('id-ID')}\n💰 Cash: Rp ${user.balance.toLocaleString('id-ID')}`)
    }
    
    let txt = `🏦 *ʙᴀɴᴋ sʏsᴛᴇᴍ*\n\n`
    txt += `> 💰 Cash: Rp ${user.balance.toLocaleString('id-ID')}\n`
    txt += `> 🏦 Bank: Rp ${user.rpg.bank.toLocaleString('id-ID')}\n\n`
    txt += `> Gunakan: \`.bank deposit <jumlah>\`\n`
    txt += `> Gunakan: \`.bank withdraw <jumlah>\`\n`
    txt += `> Tip: Gunakan 'all' untuk semua uang.`
    
    await m.reply(txt)
}

module.exports = {
    config: pluginConfig,
    handler
}
