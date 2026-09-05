const axios = require('axios')
const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const config = require('../../config')

const execAsync = promisify(exec)

const pluginConfig = {
    name: 'play',
    alias: ['p', 'playvn'],
    category: 'search',
    description: 'Putar musik dari YouTube',
    usage: '.play <query>',
    example: '.play neffex grateful',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 20,
    limit: 1,
    isEnabled: true
}

function parseDuration(durationStr) {
    if (!durationStr) return 0
    const parts = durationStr.split(':').map(Number)
    if (parts.length === 2) return parts[0] * 60 + parts[1]
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
    return 0
}

async function handler(m, { sock }) {
    const query = m.text?.trim()
    
    if (!query) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}play <query>\`\n\n` +
            `> Contoh:\n` +
            `> \`${m.prefix}play neffex grateful\``
        )
    }

    m.react("🎧")
    
    try {
        const res = await axios.get(`https://api.nekolabs.web.id/downloader/youtube/play/v1?q=${encodeURIComponent(query)}`)
        
        if (!res.data?.success || !res.data?.result) {
            return m.reply(`❌ Tidak ditemukan hasil untuk: ${query}`)
        }
        
        const { metadata, downloadUrl } = res.data.result
        
        if (!downloadUrl) {
            return m.reply(`❌ Gagal mendapatkan link download.`)
        }
        
        const tempDir = path.join(process.cwd(), 'temp')
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true })
        }
        
        const tempMp3 = path.join(tempDir, `play_${Date.now()}.mp3`)
        const tempOgg = path.join(tempDir, `play_${Date.now()}.ogg`)

        const mp3Res = await axios.get(downloadUrl, { responseType: 'arraybuffer' })
        fs.writeFileSync(tempMp3, Buffer.from(mp3Res.data))
        
        const durationSeconds = parseDuration(metadata.duration)
        const maxVnDuration = 5 * 60
        const sendAsVn = durationSeconds <= maxVnDuration
        
        let audioBuffer = fs.readFileSync(tempMp3)
        let mimetype = 'audio/mpeg'
        
        if (sendAsVn) {
            try {
                await execAsync(`ffmpeg -i "${tempMp3}" -af "highpass=f=40,bass=g=3:f=100:w=0.5,treble=g=1:f=4000,loudnorm=I=-16:TP=-1.5:LRA=11,acompressor=threshold=-20dB:ratio=4:attack=5:release=150:makeup=2dB,alimiter=limit=0.95" -c:a libopus -b:a 128k -ar 48000 -ac 2 -vn -y "${tempOgg}"`)
                if (fs.existsSync(tempOgg) && fs.statSync(tempOgg).size > 1000) {
                    audioBuffer = fs.readFileSync(tempOgg)
                    mimetype = 'audio/ogg; codecs=opus'
                }
                if (fs.existsSync(tempOgg)) fs.unlinkSync(tempOgg)
            } catch (e) {}
        }
        
        await sock.sendMessage(m.chat, {
            audio: audioBuffer,
            mimetype: mimetype,
            ptt: sendAsVn,
            fileName: sendAsVn ? undefined : `${metadata.title}.mp3`,
            contextInfo: {
                isForwarded: true,
                forwardingScore: 999,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: config.saluran?.id,
                    newsletterName: config.saluran?.name,
                },
                externalAdReply: {
                    title: metadata.title,
                    body: sendAsVn ? `${metadata.duration} • Voice Note` : `${metadata.duration} • Audio File`,
                    thumbnailUrl: metadata.cover,
                    sourceUrl: metadata.url,
                    mediaUrl: metadata.url,
                    mediaType: 2,
                    renderLargerThumbnail: true,
                }
            }
        }, { quoted: m })
        
        if (fs.existsSync(tempMp3)) fs.unlinkSync(tempMp3)
        
    } catch (err) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
