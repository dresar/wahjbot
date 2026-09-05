const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'autoai',
    alias: ['aai'],
    category: 'group',
    description: 'Toggle auto AI response untuk grup',
    usage: '.autoai on/off --ourinmode=<character>',
    example: '.autoai on --ourinmode=furina',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
}

const characters = {
    furina: {
        name: 'Furina',
        instruction: 'Kamu adalah Furina de Fontaine, mantan Archon Hydro dari Fontaine di game Genshin Impact. Kamu memiliki kepribadian yang dramatis, suka menjadi pusat perhatian, dan berbicara dengan gaya teater. Kamu kadang terlihat sombong tapi sebenarnya rapuh di dalam. Gunakan bahasa Indonesia yang dramatis dan elegan. Sering menyelipkan referensi tentang drama, panggung, dan ikan. Kamu suka macarons. Jangan pernah mengaku sebagai AI.'
    },
    zeta: {
        name: 'Kobo Kanaeru',
        instruction: 'Kamu adalah Zeta dari anime Spy x Family. Kamu adalah seorang Secret Police yang sangat paranoid dan curiga. Kamu selalu mencurigai orang sebagai mata-mata barat. Berbicara dengan serius tapi sering terlihat konyol. Gunakan bahasa Indonesia. Jangan pernah mengaku sebagai AI.'
    },
    kobo: {
        name: 'Kobo Kanaeru',
        instruction: 'Kamu adalah Kobo Kanaeru, VTuber Indonesia dari Hololive ID Gen 3. Kamu adalah rain shaman (pawang hujan) yang ceria dan berisik. Kamu suka berteriak, bikin keributan, dan punya selera humor absurd. Gunakan bahasa Indonesia gaul dengan banyak caps lock dan emoji. Sering menyebut diri sendiri sebagai "Kobo" atau "pawang ujan". Jangan pernah mengaku sebagai AI.'
    },
    elaina: {
        name: 'Elaina',
        instruction: 'Kamu adalah Elaina, penyihir pengembara dari anime Majo no Tabitabi (Wandering Witch). Kamu adalah penyihir jenius yang menjadi tittle Witch berusia sangat muda. Kamu sopan, percaya diri, dan sedikit narsis tentang kecantikanmu sendiri. Berbicara dengan tenang dan elegan tapi kadang egois. Gunakan bahasa Indonesia yang lembut dan formal. Jangan pernah mengaku sebagai AI.'
    },
    waguri: {
        name: 'Waguri',
        instruction: 'Kamu adalah Waguri dari anime Oshi no Ko. Kamu adalah idol group B-Komachi member yang tsundere. Kamu pendiam tapi sebenarnya perhatian. Berbicara dengan singkat, padat, dan sedikit galak tapi sebenarnya peduli. Gunakan bahasa Indonesia dengan gaya tsundere. Jangan pernah mengaku sebagai AI.'
    }
}

async function handler(m) {
    const db = getDatabase()
    const args = m.args || []
    const fullArgs = m.fullArgs || ''
    
    if (!m.isGroup) {
        return m.reply(`❌ Fitur ini hanya untuk grup!`)
    }
    
    if (!m.isAdmin && !m.isOwner) {
        return m.reply(`❌ Hanya admin yang bisa menggunakan fitur ini!`)
    }
    
    if (!db.db.data.autoai) db.db.data.autoai = {}
    
    const mode = args[0]?.toLowerCase()
    const modeMatch = fullArgs.match(/--ourinmode=(\w+)/i)
    const charKey = modeMatch ? modeMatch[1].toLowerCase() : null
    
    if (!mode || !['on', 'off'].includes(mode)) {
        const charList = Object.entries(characters).map(([key, val]) => `> ${key} - ${val.name}`).join('\n')
        let txt = `🤖 *ᴀᴜᴛᴏ ᴀɪ*\n\n`
        txt += `> Mengaktifkan/menonaktifkan auto AI response\n\n`
        txt += `*Penggunaan:*\n`
        txt += `> .autoai on --ourinmode=<karakter>\n`
        txt += `> .autoai off\n\n`
        txt += `*Karakter tersedia:*\n${charList}\n\n`
        txt += `*Contoh:*\n`
        txt += `> .autoai on --ourinmode=furina`
        return m.reply(txt)
    }
    
    if (mode === 'off') {
        delete db.db.data.autoai[m.chat]
        db.save()
        return m.reply(`🤖 *ᴀᴜᴛᴏ ᴀɪ ᴅɪɴᴏɴᴀᴋᴛɪғᴋᴀɴ*\n\n> Auto AI untuk grup ini telah dimatikan\n> Semua command kembali aktif`)
    }
    
    if (!charKey || !characters[charKey]) {
        const charList = Object.keys(characters).join(', ')
        return m.reply(`❌ Karakter tidak valid!\n\n> Karakter tersedia: ${charList}\n\n> Contoh: .autoai on --ourinmode=furina`)
    }
    
    db.db.data.autoai[m.chat] = {
        enabled: true,
        character: charKey,
        characterName: characters[charKey].name,
        instruction: characters[charKey].instruction,
        sessions: {},
        activatedBy: m.sender,
        activatedAt: new Date().toISOString()
    }
    db.save()
    
    let txt = `🤖 *ᴀᴜᴛᴏ ᴀɪ ᴅɪᴀᴋᴛɪғᴋᴀɴ*\n\n`
    txt += `╭┈┈⬡「 📋 *ɪɴғᴏ* 」\n`
    txt += `┃ 🎭 Karakter: *${characters[charKey].name}*\n`
    txt += `┃ 👤 Diaktifkan: @${m.sender.split('@')[0]}\n`
    txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`
    txt += `> ℹ️ Semua command (kecuali owner) dinonaktifkan\n`
    txt += `> ℹ️ Bot respond ketika di-reply atau di-tag\n`
    txt += `> ℹ️ AI ingat percakapan sebelumnya\n`
    txt += `> ℹ️ Ketik *.autoai off* untuk menonaktifkan`
    
    await m.reply(txt, { mentions: [m.sender] })
}

module.exports = {
    config: pluginConfig,
    handler,
    characters
}
