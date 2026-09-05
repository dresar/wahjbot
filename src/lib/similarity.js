/**
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
 * 
 */

function levenshteinDistance(str1, str2) {
    const m = str1.length
    const n = str2.length
    
    if (m === 0) return n
    if (n === 0) return m
    
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))
    
    for (let i = 0; i <= m; i++) dp[i][0] = i
    for (let j = 0; j <= n; j++) dp[0][j] = j
    
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost
            )
        }
    }
    
    return dp[m][n]
}

function getSimilarity(str1, str2) {
    const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase())
    const maxLen = Math.max(str1.length, str2.length)
    if (maxLen === 0) return 1
    return 1 - distance / maxLen
}

function findSimilarCommands(input, commands, options = {}) {
    const {
        maxResults = 3,
        minSimilarity = 0.4,
        maxDistance = 3
    } = options
    
    const inputLower = (input && typeof input === 'string') ? input.toLowerCase() : ''
    const results = []
    
    for (const cmd of commands) {
        if (!cmd || typeof cmd !== 'string') continue
        const cmdLower = cmd.toLowerCase()
        
        if (cmdLower.startsWith(inputLower) || inputLower.startsWith(cmdLower)) {
            results.push({
                command: cmd,
                similarity: 0.9,
                distance: Math.abs(cmd.length - input.length),
                type: 'prefix'
            })
            continue
        }
        
        const distance = levenshteinDistance(inputLower, cmdLower)
        const similarity = getSimilarity(inputLower, cmdLower)
        
        if (distance <= maxDistance || similarity >= minSimilarity) {
            results.push({
                command: cmd,
                similarity,
                distance,
                type: 'similar'
            })
        }
    }
    
    results.sort((a, b) => {
        if (b.similarity !== a.similarity) return b.similarity - a.similarity
        return a.distance - b.distance
    })
    
    return results.slice(0, maxResults)
}

function formatSuggestionMessage(inputCommand, suggestions, prefix = '.') {
    if (suggestions.length === 0) return null
    
    let msg = `🔍 *ᴄᴏᴍᴍᴀɴᴅ ɴᴏᴛ ꜰᴏᴜɴᴅ*\n\n`
    msg += `> Command \`${prefix}${inputCommand}\` tidak ditemukan.\n\n`
    
    if (suggestions.length > 0) {
        msg += `╭┈┈⬡「 💡 *ᴍᴜɴɢᴋɪɴ ᴍᴀᴋsᴜᴅᴍᴜ?* 」\n`
        
        suggestions.forEach((s, i) => {
            const matchPercent = Math.round(s.similarity * 100)
            msg += `┃ ${i + 1}. \`${prefix}${s.command}\` ─ *${matchPercent}%*\n`
        })
        
        msg += `╰┈┈⬡\n\n`
        msg += `_Ketik command yang benar untuk melanjutkan!_`
    }
    
    return msg
}

module.exports = {
    levenshteinDistance,
    getSimilarity,
    findSimilarCommands,
    formatSuggestionMessage
}
