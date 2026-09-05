const { getDatabase } = require('./database')
const { logger } = require('./colors')

const JADWAL_SHOLAT = {
    Imsak: '04:39',
    Subuh: '04:49',
    Terbit: '06:04',
    Dhuha: '06:30',
    Dzuhur: '12:06',
    Ashar: '15:21',
    Maghrib: '18:08',
    Isya: '19:38'
}

const SHOLAT_MESSAGES = {
    Imsak: '🌙 *WAKTU IMSAK*\n\n> Hai Sahabat, waktu Imsak telah tiba.\n> Segera makan sahur sebelum waktu habis.\n\n_Untuk wilayah Jakarta (WIB)_',
    Subuh: '🌅 *WAKTU SUBUH*\n\n> Hai Sahabat, waktu Sholat Subuh telah tiba.\n> Ambilah air wudhu dan segeralah sholat.\n\n_Untuk wilayah Jakarta (WIB)_',
    Terbit: '☀️ *WAKTU TERBIT*\n\n> Matahari telah terbit.\n> Selamat beraktivitas hari ini!\n\n_Untuk wilayah Jakarta (WIB)_',
    Dhuha: '🌤️ *WAKTU DHUHA*\n\n> Hai Sahabat, waktu Sholat Dhuha telah tiba.\n> Jangan lupa sholat Dhuha 2-8 rakaat.\n\n_Untuk wilayah Jakarta (WIB)_',
    Dzuhur: '🌞 *WAKTU DZUHUR*\n\n> Hai Sahabat, waktu Sholat Dzuhur telah tiba.\n> Ambilah air wudhu dan segeralah sholat.\n\n_Untuk wilayah Jakarta (WIB)_',
    Ashar: '🌇 *WAKTU ASHAR*\n\n> Hai Sahabat, waktu Sholat Ashar telah tiba.\n> Ambilah air wudhu dan segeralah sholat.\n\n_Untuk wilayah Jakarta (WIB)_',
    Maghrib: '🌆 *WAKTU MAGHRIB*\n\n> Hai Sahabat, waktu Sholat Maghrib telah tiba.\n> Ambilah air wudhu dan segeralah sholat.\n\n_Untuk wilayah Jakarta (WIB)_',
    Isya: '🌙 *WAKTU ISYA*\n\n> Hai Sahabat, waktu Sholat Isya telah tiba.\n> Ambilah air wudhu dan segeralah sholat.\n\n_Untuk wilayah Jakarta (WIB)_'
}

let lastNotifiedTime = ''
let sholatInterval = null
let sock = null

function initSholatScheduler(socketInstance) {
    sock = socketInstance
    
    if (sholatInterval) {
        clearInterval(sholatInterval)
    }
    
    sholatInterval = setInterval(checkSholatTime, 30000)
    logger.info('SholatScheduler', 'Prayer time scheduler started')
}

function getCurrentTimeWIB() {
    const now = new Date()
    const wib = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
    const hours = wib.getHours().toString().padStart(2, '0')
    const minutes = wib.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
}

async function checkSholatTime() {
    if (!sock) return
    
    const db = getDatabase()
    const globalEnabled = db.setting('autoSholat')
    
    if (!globalEnabled) return
    
    const currentTime = getCurrentTimeWIB()
    
    if (currentTime === lastNotifiedTime) return
    
    for (const [sholat, waktu] of Object.entries(JADWAL_SHOLAT)) {
        if (currentTime === waktu) {
            lastNotifiedTime = currentTime
            await sendSholatNotifications(sholat, waktu)
            
            setTimeout(() => {
                lastNotifiedTime = ''
            }, 60000)
            
            break
        }
    }
}

async function sendSholatNotifications(sholat, waktu) {
    try {
        const db = getDatabase()
        const groups = db.data?.groups || {}
        
        let sentCount = 0
        
        for (const [groupId, groupData] of Object.entries(groups)) {
            if (groupData.notifSholat !== false) {
                try {
                    const message = `${SHOLAT_MESSAGES[sholat]}\n\n⏰ *${waktu} WIB*`
                    
                    await sock.sendMessage(groupId, {
                        text: message
                    })
                    
                    sentCount++
                    
                    await new Promise(r => setTimeout(r, 1000))
                } catch (err) {
                    logger.error('SholatScheduler', `Failed to send to ${groupId}: ${err.message}`)
                }
            }
        }
        
        if (sentCount > 0) {
            logger.info('SholatScheduler', `Sent ${sholat} notification to ${sentCount} groups`)
        }
        
    } catch (error) {
        logger.error('SholatScheduler', `Error: ${error.message}`)
    }
}

function stopSholatScheduler() {
    if (sholatInterval) {
        clearInterval(sholatInterval)
        sholatInterval = null
        logger.info('SholatScheduler', 'Prayer time scheduler stopped')
    }
}

module.exports = {
    initSholatScheduler,
    stopSholatScheduler,
    JADWAL_SHOLAT
}
