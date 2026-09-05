const config = require('../../config')
const axios = require('axios')

const pluginConfig = {
    name: 'get',
    alias: ['fetch', 'http', 'request', 'curl'],
    category: 'owner',
    description: 'HTTP GET/POST request (Owner Only)',
    usage: '.get <url> [--post] [--json body]',
    example: '.get https://api.example.com/data',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 0,
    limit: 0,
    isEnabled: true
}

const CODE_EXTENSIONS = ['html', 'htm', 'js', 'css', 'json', 'xml', 'php', 'py', 'java', 'c', 'cpp', 'ts', 'jsx', 'tsx', 'vue', 'svelte', 'md', 'yaml', 'yml', 'sql', 'sh', 'bash']
const CODE_MIMETYPES = ['text/html', 'text/javascript', 'application/javascript', 'text/css', 'application/json', 'text/xml', 'application/xml', 'text/plain']

function getFileExtension(url, contentType) {
    try {
        const urlPath = new URL(url).pathname
        const ext = urlPath.split('.').pop()?.toLowerCase()
        if (ext && CODE_EXTENSIONS.includes(ext)) return ext
    } catch {}
    
    if (contentType) {
        if (contentType.includes('html')) return 'html'
        if (contentType.includes('javascript')) return 'js'
        if (contentType.includes('css')) return 'css'
        if (contentType.includes('json')) return 'json'
        if (contentType.includes('xml')) return 'xml'
    }
    
    return null
}

function isCodeResponse(contentType, data) {
    if (!contentType) return false
    
    for (const mime of CODE_MIMETYPES) {
        if (contentType.includes(mime)) return true
    }
    
    if (typeof data === 'string') {
        if (data.trim().startsWith('<!DOCTYPE') || data.trim().startsWith('<html')) return true
        if (data.trim().startsWith('<?xml')) return true
    }
    
    return false
}

async function handler(m, { sock }) {
    if (!config.isOwner(m.sender)) {
        return m.reply('❌ *Owner Only!*')
    }
    
    const input = m.fullArgs?.trim() || m.text?.trim()
    
    if (!input) {
        return m.reply(
            `🌐 *ʜᴛᴛᴘ ʀᴇǫᴜᴇsᴛ*\n\n` +
            `> Masukkan URL!\n\n` +
            `*Usage:*\n` +
            `> .get <url> - GET request\n` +
            `> .get <url> --post - POST request\n` +
            `> .get <url> --post --json {"key":"value"}\n\n` +
            `*Contoh:*\n` +
            `> .get https://api.github.com\n` +
            `> .get https://api.example.com --post --json {"name":"test"}`
        )
    }
    
    const isPost = input.includes('--post')
    let url = input.replace(/--post/gi, '').trim()
    
    let jsonBody = null
    const jsonMatch = url.match(/--json\s+(\{[\s\S]*\})/i)
    if (jsonMatch) {
        try {
            jsonBody = JSON.parse(jsonMatch[1])
            url = url.replace(/--json\s+\{[\s\S]*\}/i, '').trim()
        } catch (e) {
            return m.reply(`❌ Invalid JSON: ${e.message}`)
        }
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url
    }
    
    try {
        new URL(url)
    } catch {
        return m.reply(`❌ Invalid URL: ${url}`)
    }
    
    await m.reply(`⏳ Fetching ${isPost ? 'POST' : 'GET'} ${url}...`)
    
    try {
        const startTime = Date.now()
        
        const axiosConfig = {
            timeout: 30000,
            headers: {
                'User-Agent': 'Ourin-Bot/1.0',
                'Accept': '*/*'
            },
            validateStatus: () => true,
            maxRedirects: 5
        }
        
        if (isPost) {
            axiosConfig.headers['Content-Type'] = 'application/json'
        }
        
        let response
        if (isPost) {
            response = await axios.post(url, jsonBody, axiosConfig)
        } else {
            response = await axios.get(url, axiosConfig)
        }
        
        const elapsed = Date.now() - startTime
        const contentType = response.headers['content-type'] || ''
        
        let data = response.data
        if (typeof data === 'object') {
            data = JSON.stringify(data, null, 2)
        } else {
            data = String(data)
        }
        
        const isCode = isCodeResponse(contentType, data)
        const fileExt = getFileExtension(url, contentType)
        const statusEmoji = response.status >= 200 && response.status < 300 ? '✅' : '⚠️'
        
        const infoText = `🌐 *ʜᴛᴛᴘ ʀᴇsᴘᴏɴsᴇ*\n\n` +
            `╭┈┈⬡「 📋 *ɪɴғᴏ* 」\n` +
            `┃ ${statusEmoji} Status: ${response.status} ${response.statusText}\n` +
            `┃ ⏱️ Time: ${elapsed}ms\n` +
            `┃ 📦 Size: ${data.length} bytes\n` +
            `┃ 📄 Type: ${contentType.split(';')[0] || 'unknown'}\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        
        if (isCode && data.length > 1000) {
            const fileName = `response.${fileExt || 'txt'}`
            const buffer = Buffer.from(data, 'utf-8')
            
            await sock.sendMessage(m.chat, {
                document: buffer,
                fileName: fileName,
                mimetype: 'text/plain',
                caption: infoText
            }, { quoted: m })
        } else {
            if (data.length > 3000) {
                data = data.slice(0, 3000) + '\n\n... (truncated)'
            }
            
            await m.reply(infoText + `\n\n\`\`\`${data}\`\`\``)
        }
    } catch (e) {
        await m.reply(
            `❌ *ʀᴇǫᴜᴇsᴛ ғᴀɪʟᴇᴅ*\n\n` +
            `> ${e.message}`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
