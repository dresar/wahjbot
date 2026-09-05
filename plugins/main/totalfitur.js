const { getAllPlugins } = require('../../src/lib/plugins')
const { createCanvas } = require('@napi-rs/canvas')
const config = require('../../config')

const pluginConfig = {
    name: 'totalfitur',
    alias: ['totalfeature', 'totalcmd', 'countplugin', 'distribusi'],
    category: 'main',
    description: 'Lihat total fitur/command bot dengan chart',
    usage: '.totalfitur',
    example: '.totalfitur',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    limit: 0,
    isEnabled: true
}

function drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
}

async function createDistributionChart(categories, totalCommands) {
    const barColors = ['#4ade80', '#60a5fa', '#fbbf24', '#f87171', '#a78bfa', '#2dd4bf', '#fb923c', '#e879f9']
    const sorted = Object.entries(categories).sort((a, b) => b[1].total - a[1].total).slice(0, 8)
    
    const padding = 40
    const barHeight = 35
    const barGap = 55
    const chartWidth = 380
    const canvasWidth = 460
    const canvasHeight = padding * 2 + sorted.length * barGap + 60
    
    const canvas = createCanvas(canvasWidth, canvasHeight)
    const ctx = canvas.getContext('2d')
    
    ctx.fillStyle = '#0f0f0f'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    
    drawRoundedRect(ctx, 15, 15, canvasWidth - 30, canvasHeight - 30, 20)
    ctx.fillStyle = '#1a1a1a'
    ctx.fill()
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 1
    ctx.stroke()
    
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 22px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Distribusi Fitur Bot', canvasWidth / 2, padding + 10)
    
    const startY = padding + 50
    const maxVal = Math.max(...sorted.map(([, d]) => d.total))
    
    sorted.forEach(([cat, data], i) => {
        const y = startY + i * barGap
        const pct = ((data.total / totalCommands) * 100).toFixed(1)
        const barWidth = (data.total / maxVal) * chartWidth
        const color = barColors[i % barColors.length]
        
        ctx.fillStyle = '#cccccc'
        ctx.font = 'bold 14px sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(cat.toUpperCase(), padding, y)
        
        ctx.fillStyle = '#888888'
        ctx.font = '14px sans-serif'
        ctx.textAlign = 'right'
        ctx.fillText(`${data.total}  ${pct}%`, canvasWidth - padding, y)
        
        drawRoundedRect(ctx, padding, y + 8, chartWidth, barHeight - 8, 5)
        ctx.fillStyle = '#2a2a2a'
        ctx.fill()
        
        if (barWidth > 5) {
            drawRoundedRect(ctx, padding, y + 8, barWidth, barHeight - 8, 5)
            ctx.fillStyle = color
            ctx.fill()
        }
    })
    
    ctx.fillStyle = '#666666'
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`Total: ${totalCommands} fitur`, canvasWidth / 2, canvasHeight - 30)
    
    return canvas.toBuffer('image/png')
}

async function handler(m, { sock }) {
    try {
        const allPlugins = getAllPlugins()
        
        const categories = {}
        let totalCommands = 0
        
        for (const plugin of allPlugins) {
            if (!plugin.config) continue
            
            const cat = plugin.config.category || 'other'
            if (!categories[cat]) {
                categories[cat] = { total: 0, enabled: 0 }
            }
            
            categories[cat].total++
            totalCommands++
            
            if (plugin.config.isEnabled !== false) {
                categories[cat].enabled++
            }
        }
        
        await m.react('📊')
        
        const chartBuffer = await createDistributionChart(categories, totalCommands)
        
        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
        
        const sorted = Object.entries(categories).sort((a, b) => b[1].total - a[1].total)
        let caption = `📊 *ᴅɪsᴛʀɪʙᴜsɪ ꜰɪᴛᴜʀ ʙᴏᴛ*\n\n`
        caption += `╭┈┈⬡「 📈 *ᴋᴀᴛᴇɢᴏʀɪ* 」\n`
        
        sorted.forEach(([cat, data]) => {
            const pct = ((data.total / totalCommands) * 100).toFixed(1)
            caption += `┃ \`\`\`${cat.toUpperCase()}\`\`\`: \`${data.total}\` (${pct}%)\n`
        })
        caption += `╰┈┈⬡\n\n`
        caption += `> _Total: *${totalCommands}* fitur_`
        
        await sock.sendMessage(m.chat, {
            image: chartBuffer,
            caption,
            contextInfo: {
                forwardingScore: 9999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: saluranId,
                    newsletterName: saluranName,
                    serverMessageId: 127
                }
            }
        }, { quoted: m })
        
    } catch (error) {
        await m.react('❌')
        await m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
