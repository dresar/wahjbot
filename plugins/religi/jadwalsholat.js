const axios = require('axios')
const moment = require('moment-timezone')

const pluginConfig = {
    name: 'jadwalsholat',
    alias: ['sholat', 'prayertime', 'jadwalsolat', 'waktusolat', 'waktusholat'],
    category: 'religi',
    description: 'Menampilkan jadwal sholat berdasarkan kota',
    usage: '.jadwalsholat <kota>',
    example: '.jadwalsholat Jakarta',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
}

const cityMapping = {
    'jakarta': 1301,
    'bandung': 1501,
    'surabaya': 1601,
    'semarang': 1518,
    'yogyakarta': 1520,
    'medan': 1204,
    'makassar': 1901,
    'palembang': 1601,
    'tangerang': 1301,
    'depok': 1301,
    'bekasi': 1301,
    'bogor': 1301,
    'malang': 1519,
    'batam': 2101,
    'pekanbaru': 1401,
    'denpasar': 1701,
    'padang': 1301,
    'banjarmasin': 1801,
    'pontianak': 1701,
    'samarinda': 1601,
}

async function getScheduleFromAPI(city) {
    try {
        const cityId = cityMapping[city.toLowerCase()] || 1301
        const today = moment.tz('Asia/Jakarta').format('YYYY-MM-DD')
        
        const res = await axios.get(`https://api.myquran.com/v2/sholat/jadwal/${cityId}/${today}`, {
            timeout: 10000
        })
        
        if (res.data?.status && res.data?.data?.jadwal) {
            return {
                success: true,
                data: res.data.data.jadwal,
                location: res.data.data.lokasi || city
            }
        }
        
        return { success: false, error: 'Data tidak ditemukan' }
    } catch (e) {
        return { success: false, error: e.message }
    }
}

async function getScheduleFromAladhan(city) {
    try {
        const today = moment.tz('Asia/Jakarta')
        const date = today.format('DD-MM-YYYY')
        
        const res = await axios.get(`https://api.aladhan.com/v1/timingsByCity/${date}`, {
            params: {
                city: city,
                country: 'Indonesia',
                method: 20
            },
            timeout: 10000
        })
        
        if (res.data?.code === 200 && res.data?.data?.timings) {
            const timings = res.data.data.timings
            return {
                success: true,
                data: {
                    imsak: timings.Imsak?.substring(0, 5) || '-',
                    subuh: timings.Fajr?.substring(0, 5) || '-',
                    terbit: timings.Sunrise?.substring(0, 5) || '-',
                    dhuha: timings.Dhuha?.substring(0, 5) || '-',
                    dzuhur: timings.Dhuhr?.substring(0, 5) || '-',
                    ashar: timings.Asr?.substring(0, 5) || '-',
                    maghrib: timings.Maghrib?.substring(0, 5) || '-',
                    isya: timings.Isha?.substring(0, 5) || '-'
                },
                location: city
            }
        }
        
        return { success: false, error: 'Data tidak ditemukan' }
    } catch (e) {
        return { success: false, error: e.message }
    }
}

async function handler(m, { sock }) {
    const city = m.args.join(' ').trim() || 'Jakarta'
    
    m.react('🕌')
    
    try {
        let result = await getScheduleFromAPI(city)
        
        if (!result.success) {
            result = await getScheduleFromAladhan(city)
        }
        
        if (!result.success) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Tidak bisa mendapatkan jadwal sholat untuk "${city}"\n> Error: ${result.error}`)
        }
        
        const schedule = result.data
        const location = result.location
        const today = moment.tz('Asia/Jakarta').format('dddd, DD MMMM YYYY')
        
        const text = `🕌 *ᴊᴀᴅᴡᴀʟ sʜᴏʟᴀᴛ*

╭┈┈⬡「 📍 *${location}* 」
┃ 📅 ${today}
╰┈┈⬡

╭┈┈⬡「 ⏰ *ᴡᴀᴋᴛᴜ sʜᴏʟᴀᴛ* 」
┃ 🌙 ɪᴍsᴀᴋ: \`${schedule.imsak || '-'}\`
┃ 🌅 sᴜʙᴜʜ: \`${schedule.subuh || '-'}\`
┃ ☀️ ᴛᴇʀʙɪᴛ: \`${schedule.terbit || '-'}\`
┃ 🌤️ ᴅʜᴜʜᴀ: \`${schedule.dhuha || '-'}\`
┃ 🌞 ᴅᴢᴜʜᴜʀ: \`${schedule.dzuhur || '-'}\`
┃ 🌇 ᴀsʜᴀʀ: \`${schedule.ashar || '-'}\`
┃ 🌆 ᴍᴀɢʜʀɪʙ: \`${schedule.maghrib || '-'}\`
┃ 🌃 ɪsʏᴀ: \`${schedule.isya || '-'}\`
╰┈┈⬡

> _Jangan lupa sholat ya! 🤲_`

        m.react('✅')
        await m.reply(text)
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
