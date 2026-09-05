/**
 * Untuk gambar/audio/video, ada di folder 'assets'
 * 
 * Credits & Thanks to
 * Developer = Lucky Archz ( Zann )
 * Lead owner = HyuuSATAN
 * Owner = Keisya
 * Designer = Danzzz
 * RexxHayanasi = Penyedia baileys
 * Penyedia API
 * Penyedia Scraper
 * 
 * JANGAN HAPUS/GANTI CREDITS & THANKS TO
 * JANGAN DIJUAL YA MEK
 * 
 * Saluran Resmi Ourin:
 * https://whatsapp.com/channel/0029VbB37bgBfxoAmAlsgE0t 
 */

const config = {

    info: {
        website: 'https://www.ourin.my.id'
    },

    owner: {
        name: 'Eka Syarif Maulana',                    // Nama owner
        number: ['6282392115909']         // Format: 628xxx (tanpa + atau 0)
    },

    session: {
        pairingNumber: '6287822512610',   // Nomor WA yang akan di-pair
        usePairingCode: false              // true = Pairing Code, false = QR Code
    },

    bot: {
        name: '𝗢𝗨𝗥𝗜𝗡 𝗠𝗗',                 // Nama bot
        version: '1.7.0',                 // Versi bot
        developer: 'Zann RDZ'          // Nama developer
    },

    // kayaknya bakal gak work, kalau gak work nunggu next update
    apiReactCh: [
        '5a4df709f79c62e074f0e8128b001e9e54256a39027157680e87c7db666287fa'
    ], // ambil apikey baru di https://asitha.top/login

    mode: 'public',

    command: {
        prefix: '.'                       // Prefix utama (.menu, .help, dll)
    },

    store: {
        payment: [
            { name: 'Dana', number: '08xxxxxxxxxx', holder: 'Nama Pemilik' },
            { name: 'OVO', number: '08xxxxxxxxxx', holder: 'Nama Pemilik' },
            { name: 'GoPay', number: '08xxxxxxxxxx', holder: 'Nama Pemilik' },
            { name: 'ShopeePay', number: '08xxxxxxxxxx', holder: 'Nama Pemilik' }
        ]
    },

    donasi: {
        payment: [
            { name: 'Dana', number: '08xxxxxxxxxx', holder: 'Nama Owner' },
            { name: 'GoPay', number: '08xxxxxxxxxx', holder: 'Nama Owner' },
            { name: 'OVO', number: '08xxxxxxxxxx', holder: 'Nama Owner' }
        ],
        links: [
            { name: 'Saweria', url: 'saweria.co/username' },
            { name: 'Trakteer', url: 'trakteer.id/username' }
        ],
        benefits: [
            'Mendukung development',
            'Server lebih stabil',
            'Fitur baru lebih cepat',
            'Priority support'
        ]
    },

    limits: {
        default: 25,                      // User biasa
        premium: 100,                     // Premium user
        owner: -1                         // Owner (-1 = unlimited)
    },

    sticker: {
        packname: 'Ourin-AI',             // Nama pack sticker
        author: 'Bot'                     // Author sticker
    },

    saluran: {
        id: '120363400911374213@newsletter',                           // ID saluran (contoh: 120363xxx@newsletter)
        name: '- Kunjungi Saluran Resmi dari Bot Ourin',       // Nama saluran
        link: 'https://whatsapp.com/channel/0029VbB37bgBfxoAmAlsgE0t'                          // Link saluran
    },

    features: {
        antiSpam: true,
        antiSpamInterval: 3000,
        antiCall: true,
        autoTyping: true,
        autoRead: false,
        logMessage: true,
        dailyLimitReset: true,
        smartTriggers: false
    },

    welcome: { defaultEnabled: false },
    goodbye: { defaultEnabled: false },

    premiumUsers: [],
    bannedUsers: [],
    dynamicOwners: [],

    ui: {
        menuVariant: 2
    },

    messages: {
        wait: '⏳ Tunggu sebentar...',
        success: '✅ Berhasil!',
        error: '❌ Terjadi kesalahan!',
        ownerOnly: '🚫 Command ini khusus owner!',
        premiumOnly: '💎 Command ini khusus premium!',
        groupOnly: '👥 Command ini hanya untuk grup!',
        privateOnly: '📱 Command ini hanya untuk private chat!',
        adminOnly: '👮 Command ini khusus admin grup!',
        botAdminOnly: '🤖 Bot harus menjadi admin grup!',
        cooldown: '⏱️ Tunggu %time% detik lagi!',
        limitExceeded: '📊 Limit harian kamu sudah habis!',
        banned: '🚫 Kamu dibanned dari bot ini!'
    },

    database: { path: './src/database' },
    backup: { enabled: false, intervalHours: 24, retainDays: 7 },
    scheduler: { resetHour: 0, resetMinute: 0 },

    // Dev mode settings (auto-enabled jika NODE_ENV=development)
    dev: {
        enabled: process.env.NODE_ENV === 'development',
        watchPlugins: true,    // Hot reload plugins (SAFE)
        watchSrc: false,       // DISABLED - src reload causes connection conflict 440
        debugLog: false        // Show stack traces
    },

    pterodactyl: {
        server1: {
            domain: '',
            apikey: '',
            capikey: '',
            egg: '15',
            nestid: '5',
            location: '1'
        },
        // server2: {
        //     domain: '',
        //     apikey: '',
        //     capikey: '',
        //     egg: '15',
        //     nestid: '5',
        //     location: '1'
        // },
        // server3: {
        //     domain: '',
        //     apikey: '',
        //     capikey: '',
        //     egg: '15',
        //     nestid: '5',
        //     location: '1'
        // },
        sellers: [],
        ownerPanels: []
    },

}


// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS - Jangan diubah tod, nanti elol!
// ═══════════════════════════════════════════════════════════════════════════

function isOwner(number) {
    if (!number) return false
    const cleanNumber = number.replace(/[^0-9]/g, '')
    
    if (config.bot.number) {
        const botClean = config.bot.number.replace(/[^0-9]/g, '')
        if (cleanNumber === botClean || cleanNumber.endsWith(botClean) || botClean.endsWith(cleanNumber)) return true
    }
    
    const allOwners = [...config.owner.number]
    
    if (config.dynamicOwners && Array.isArray(config.dynamicOwners)) {
        allOwners.push(...config.dynamicOwners)
    }
    
    return allOwners.some(owner => {
        if (!owner) return false
        const cleanOwner = owner.replace(/[^0-9]/g, '')
        return cleanNumber === cleanOwner || cleanNumber.endsWith(cleanOwner) || cleanOwner.endsWith(cleanNumber)
    })
}

function isPremium(number) {
    if (!number) return false
    if (isOwner(number)) return true
    
    const cleanNumber = number.replace(/[^0-9]/g, '')
    return config.premiumUsers.some(premium => {
        const cleanPremium = premium.replace(/[^0-9]/g, '')
        return cleanNumber === cleanPremium || cleanNumber.endsWith(cleanPremium) || cleanPremium.endsWith(cleanNumber)
    })
}

function isBanned(number) {
    if (!number) return false
    if (isOwner(number)) return false
    
    const cleanNumber = number.replace(/[^0-9]/g, '')
    return config.bannedUsers.some(banned => {
        const cleanBanned = banned.replace(/[^0-9]/g, '')
        return cleanNumber === cleanBanned || cleanNumber.endsWith(cleanBanned) || cleanBanned.endsWith(cleanNumber)
    })
}

function setBotNumber(number) {
    if (number) config.bot.number = number.replace(/[^0-9]/g, '')
}

function isSelf(number) {
    if (!number || !config.bot.number) return false
    const cleanNumber = number.replace(/[^0-9]/g, '')
    const botNumber = config.bot.number.replace(/[^0-9]/g, '')
    return cleanNumber.includes(botNumber) || botNumber.includes(cleanNumber)
}

function getConfig() { return config }

module.exports = {
    ...config,
    config,
    getConfig,
    isOwner,
    isPremium,
    isBanned,
    setBotNumber,
    isSelf
}
