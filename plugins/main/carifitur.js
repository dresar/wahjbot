const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'carifitur',
    alias: ['searchcmd', 'findcmd', 'cari', 'search'],
    category: 'main',
    description: 'Mencari fitur berdasarkan keyword',
    usage: '.carifitur <keyword>',
    example: '.carifitur fake',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    limit: 0,
    isEnabled: true
}

function levenshteinDistance(str1, str2) {
    const m = str1.length
    const n = str2.length
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))
    
    for (let i = 0; i <= m; i++) dp[i][0] = i
    for (let j = 0; j <= n; j++) dp[0][j] = j
    
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1]
            } else {
                dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
            }
        }
    }
    return dp[m][n]
}

function getSimilarity(str1, str2) {
    if (typeof str1 !== 'string' || typeof str2 !== 'string') return 0
    const maxLen = Math.max(str1.length, str2.length)
    if (maxLen === 0) return 1
    const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase())
    return (maxLen - distance) / maxLen
}

function matchesKeyword(text, keyword) {
    if (!text || !keyword) return false
    if (typeof text !== 'string' || typeof keyword !== 'string') return false
    const textLower = text.toLowerCase()
    const keywordLower = keyword.toLowerCase()
    
    if (textLower.includes(keywordLower)) return true
    if (keywordLower.includes(textLower)) return true
    
    const similarity = getSimilarity(textLower, keywordLower)
    if (similarity >= 0.6) return true
    
    return false
}

function loadAllPlugins() {
    const plugins = []
    const pluginsDir = path.join(__dirname, '..')
    
    try {
        const categories = fs.readdirSync(pluginsDir).filter(f => {
            const stat = fs.statSync(path.join(pluginsDir, f))
            return stat.isDirectory()
        })
        
        for (const category of categories) {
            const categoryPath = path.join(pluginsDir, category)
            const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.js'))
            
            for (const file of files) {
                try {
                    const plugin = require(path.join(categoryPath, file))
                    if (plugin.config && plugin.config.name) {
                        plugins.push({
                            name: plugin.config.name,
                            alias: plugin.config.alias || [],
                            category: plugin.config.category || category,
                            description: plugin.config.description || '',
                            usage: plugin.config.usage || '',
                            isEnabled: plugin.config.isEnabled !== false
                        })
                    }
                } catch (e) {}
            }
        }
    } catch (e) {}
    
    return plugins
}

async function handler(m, { sock }) {
    const keyword = m.args.join(' ').trim()
    
    if (!keyword) {
        return m.reply(
            `🔍 *ᴄᴀʀɪ ꜰɪᴛᴜʀ*\n\n` +
            `> Gunakan: \`${m.prefix}carifitur <keyword>\`\n\n` +
            `> Contoh:\n` +
            `> \`${m.prefix}carifitur fake\`\n` +
            `> \`${m.prefix}carifitur sticker\`\n` +
            `> \`${m.prefix}carifitur download\``
        )
    }
    
    m.react('🔍')
    
    try {
        const allPlugins = loadAllPlugins()
        const matches = []
        
        for (const plugin of allPlugins) {
            if (!plugin.isEnabled) continue
            
            let isMatch = false
            let matchScore = 0
            
            if (matchesKeyword(plugin.name, keyword)) {
                isMatch = true
                matchScore = Math.max(matchScore, getSimilarity(plugin.name, keyword))
            }
            
            for (const alias of plugin.alias) {
                if (matchesKeyword(alias, keyword)) {
                    isMatch = true
                    matchScore = Math.max(matchScore, getSimilarity(alias, keyword))
                }
            }
            
            if (matchesKeyword(plugin.description, keyword)) {
                isMatch = true
                matchScore = Math.max(matchScore, getSimilarity(plugin.description, keyword) * 0.8)
            }
            
            if (matchesKeyword(plugin.category, keyword)) {
                isMatch = true
                matchScore = Math.max(matchScore, getSimilarity(plugin.category, keyword) * 0.7)
            }
            
            if (isMatch) {
                matches.push({ ...plugin, score: matchScore })
            }
        }
        
        matches.sort((a, b) => b.score - a.score)
        
        if (matches.length === 0) {
            m.react('❌')
            return m.reply(`🔍 *ʜᴀsɪʟ ᴘᴇɴᴄᴀʀɪᴀɴ*\n\n> Tidak ditemukan fitur dengan keyword \`${keyword}\``)
        }
        
        const grouped = {}
        for (const match of matches.slice(0, 30)) {
            const cat = match.category.toUpperCase()
            if (!grouped[cat]) grouped[cat] = []
            grouped[cat].push(match)
        }
        
        let text = `🔍 *ʜᴀsɪʟ ᴘᴇɴᴄᴀʀɪᴀɴ: "${keyword}"*\n\n`
        text += `> Ditemukan \`${matches.length}\` fitur\n\n`
        
        for (const [category, plugins] of Object.entries(grouped)) {
            text += `╭┈┈⬡「 *${category}* 」\n`
            for (const p of plugins) {
                text += `┃ ⌞ \`${m.prefix}${p.name}\`\n`
            }
            text += `╰┈┈⬡\n\n`
        }
        
        text += `> _Ketik command untuk info lebih lanjut_`
        
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
