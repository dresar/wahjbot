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

const config = require('../config');
const { isSelf } = require('../config');
const { serialize } = require('./lib/serialize');
const { getPlugin, getPluginCount, getAllPlugins, pluginStore } = require('./lib/plugins');
const { findSimilarCommands, formatSuggestionMessage } = require('./lib/similarity');
const { getDatabase } = require('./lib/database');
const { formatUptime, createWaitMessage, createErrorMessage } = require('./lib/formatter');
const { getUptime } = require('./connection');
const { logger, logMessage, logCommand, c } = require('./lib/colors');
const { isLid, isLidConverted, lidToJid, convertLidArray, resolveAnyLidToJid, cacheParticipantLids } = require('./lib/lidHelper');
const { hasActiveSession } = require('./lib/gameData');
const { 
    handleAntilink, 
    handleAntiRemove,
    cacheMessageForAntiRemove 
} = require('./lib/groupProtection');
const { debounceMessage, getCachedUser, getCachedGroup, getCachedSetting } = require('./lib/performanceOptimizer');
const fs = require("fs")

let checkAfk = null;
let isMuted = null;
let checkSpam = null;
let checkSlowmode = null;
let addXp = null;
let checkLevelUp = null;
let incrementChatCount = null;
let checkStickerCommand = null;

// Antispam delay tracker - users who were detected spamming get 3s delay
const spamDelayTracker = new Map();

try {
    checkAfk = require('../plugins/group/afk').checkAfk;
} catch (e) {}

try {
    isMuted = require('../plugins/group/mute').isMuted;
} catch (e) {}

try {
    checkSpam = require('../plugins/group/antispam').checkSpam;
} catch (e) {}

try {
    checkSlowmode = require('../plugins/group/slowmode').checkSlowmode;
} catch (e) {}

let isToxic = null;
let handleToxicMessage = null;
try {
    const toxicModule = require('../plugins/group/antitoxic');
    isToxic = toxicModule.isToxic;
    handleToxicMessage = toxicModule.handleToxicMessage;
} catch (e) {}

let handleAutoAI = null;
try {
    handleAutoAI = require('./lib/autoaiHandler').handleAutoAI;
} catch (e) {}

try {
    const levelModule = require('../plugins/user/level');
    addXp = levelModule.addXp;
    checkLevelUp = levelModule.checkLevelUp;
} catch (e) {}

try {
    incrementChatCount = require('../plugins/group/totalchat').incrementChatCount;
} catch (e) {}

try {
    checkStickerCommand = require('./lib/stickerCommand').checkStickerCommand;
} catch (e) {}

/**
 * @typedef {Object} HandlerContext
 * @property {Object} sock - Socket connection
 * @property {Object} m - Serialized message
 * @property {Object} config - Bot configuration
 * @property {Object} db - Database instance
 * @property {number} uptime - Bot uptime
 */

/**
 * Anti-spam map untuk tracking pesan per user
 * @type {Map<string, number>}
 */
const spamMap = new Map();

const gamePlugins = [
    'asahotak', 'tebakkata', 'tebakgambar', 'siapakahaku', 
    'tekateki', 'susunkata', 'caklontong', 'family100',
    'tebakbendera', 'tebakkalimat', 'tebaklirik', 'tebaktebakan', 'tebakkimia',
    'tebakdrakor', 'tebakepep', 'tebakjkt48', 'tebakmakanan', 'quizbattle'
];

// Pre-cache game plugins at startup for performance
const cachedGamePlugins = new Map();
for (const gameName of gamePlugins) {
    try {
        const plugin = require(`../plugins/game/${gameName}`);
        if (plugin.answerHandler) cachedGamePlugins.set(gameName, plugin);
    } catch (e) {}
}

let sulapPlugin = null;
try {
    sulapPlugin = require('../plugins/fun/sulap');
} catch (e) {}

async function handleGameAnswer(m, sock) {
    try {
        try {
            const sulapPlugin = require('../plugins/fun/sulap');
            if (sulapPlugin?.answerHandler) {
                const handled = await sulapPlugin.answerHandler(m, sock);
                if (handled) return true;
            }
        } catch (e) {}
        
        for (const [, gamePlugin] of cachedGamePlugins) {
            const handled = await gamePlugin.answerHandler(m, sock);
            if (handled) return true;
        }
    } catch (error) {}
    return false;
}

async function handleSmartTriggers(m, sock, db) {
    if (m.isCommand) return false
    if (!m.body) return false
    
    const globalSmartTriggers = db.setting('smartTriggers') ?? config.features?.smartTriggers ?? false
    
    try {
        const text = m.body.trim().toLowerCase()
        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
        const botName = config.bot?.name || 'Ourin-AI'
        
        let isAutoreplyEnabled = globalSmartTriggers
        
        if (m.isGroup) {
            const groupData = db.getGroup(m.chat) || {}
            isAutoreplyEnabled = groupData.autoreply ?? globalSmartTriggers
            
            if (!isAutoreplyEnabled) return false
            
            const customReplies = groupData.customReplies || []
            for (const reply of customReplies) {
                if (text === reply.trigger || text.includes(reply.trigger)) {
                    await sock.sendMessage(m.chat, { text: reply.reply }, { quoted: m })
                    return true
                }
            }
        } else {
            if (!globalSmartTriggers) return false
        }
        
        if (!isAutoreplyEnabled) return false
        
        const botJid = sock.user?.id
        const isMentioned = m.mentionedJid?.some(jid => 
            jid === botJid || jid?.includes(sock.user?.id?.split(':')[0])
        )
        
        let thumbBuffer = null
        const thumbPath = './assets/images/ourin2.jpg'
        try {
            if (fs.existsSync(thumbPath)) {
                thumbBuffer = fs.readFileSync(thumbPath)
            }
        } catch (e) {}
        
        const contextInfos = {
            forwardingScore: 9999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: saluranId,
                newsletterName: saluranName,
                serverMessageId: 127
            }
        }
        
        if (thumbBuffer) {
            contextInfos.externalAdReply = {
                title: botName,
                body: config.bot?.version ? `v${config.bot.version}` : null,
                thumbnail: thumbBuffer,
                mediaType: 1,
                sourceUrl: config.saluran?.link || 'https://wa.me/6281277777777',
                renderLargerThumbnail: false
            }
        }
        
        if (isMentioned) {
            await sock.sendMessage(m.chat, {
                text: `👋 *ʜᴀɪ!*\n\n` +
                    `> Ada yang manggil ${botName}?\n` +
                    `> Ketik \`.menu\` untuk melihat fitur!\n\n` +
                    `> _${botName} siap membantu! ✨_`,
                contextInfo: contextInfos
            }, { quoted: m })
            return true
        }
        
        if (m.isGroup && text?.toLowerCase() === 'p') {
            await sock.sendMessage(m.chat, {
                text: `💬 *ʜᴀɪ @${m.sender.split('@')[0]}!*\n\n` +
                    `> Budayakan salam sebelum\n` +
                    `> memulai percakapan! 🙏\n\n` +
                    `> _Contoh: Assalamualaikum, Halo, dll_`,
                mentions: [m.sender],
                contextInfo: contextInfos
            }, { quoted: m })
            return true
        }
        
        if (m.isGroup && (text?.toLowerCase() === 'bot' || text?.toLowerCase().includes('ourin'))) {
            await sock.sendMessage(m.chat, {
                text: `🤖 *ʙᴏᴛ ᴀᴋᴛɪꜰ*\n\n` +
                    `> ${botName} online dan siap!\n` +
                    `> Ketik \`.menu\` untuk melihat fitur\n\n` +
                    `> _Response time: < 1s ⚡_`,
                contextInfo: contextInfos
            }, { quoted: m })
            return true
        }

        if(m.isGroup && text?.toLowerCase()?.includes("assalamualaikum")) {
            await sock.sendMessage(m.chat, {
                text: `Waaalaikumssalam saudaraku`,
                contextInfo: contextInfos
            }, { quoted: m })
            return true
        }
    } catch (error) {
        console.error('[SmartTriggers] Error:', error.message)
    }
    
    return false
}

/**
 * Cek apakah user sedang spam
 * @param {string} jid - JID user
 * @returns {boolean} True jika sedang spam
 */
function isSpamming(jid) {
    if (!config.features?.antiSpam) return false;
    
    const now = Date.now();
    const lastMessage = spamMap.get(jid) || 0;
    const interval = config.features?.antiSpamInterval || 3000;
    
    if (now - lastMessage < interval) {
        return true;
    }
    
    spamMap.set(jid, now);
    return false;
}

/**
 * Cek permission untuk menjalankan command
 * @param {Object} m - Serialized message
 * @param {Object} pluginConfig - Konfigurasi plugin
 * @returns {{allowed: boolean, reason: string}} Object dengan status dan alasan
 */
function checkPermission(m, pluginConfig) {
    if (pluginConfig.isOwner && !m.isOwner) {
        return { allowed: false, reason: config.messages?.ownerOnly || '🚫 Owner only!' };
    }
    
    if (pluginConfig.isPremium && !m.isPremium && !m.isOwner) {
        return { allowed: false, reason: config.messages?.premiumOnly || '💎 Premium only!' };
    }
    
    if (pluginConfig.isGroup && !m.isGroup) {
        return { allowed: false, reason: config.messages?.groupOnly || '👥 Group only!' };
    }
    
    if (pluginConfig.isPrivate && m.isGroup) {
        return { allowed: false, reason: config.messages?.privateOnly || '📱 Private chat only!' };
    }
    
    if (pluginConfig.isAdmin && m.isGroup && !m.isAdmin && !m.isOwner) {
        return { allowed: false, reason: config.messages?.adminOnly || '👮 Admin grup only!' };
    }
    
    if (pluginConfig.isBotAdmin && m.isGroup && !m.isBotAdmin) {
        return { allowed: false, reason: config.messages?.botAdminOnly || '🤖 Bot harus menjadi admin grup!' };
    }
    
    return { allowed: true, reason: '' };
}

/**
 * Cek mode bot dengan validasi kuat
 * @param {Object} m - Serialized message
 * @returns {boolean} True jika boleh diproses
 */
function checkMode(m) {
    const db = getDatabase()
    const realConfig = require('../config')
    const dbMode = db.setting('botMode')
    const mode = dbMode || realConfig.config.mode || 'public'
    
    const onlyGc = db.setting('onlyGc')
    const onlyPc = db.setting('onlyPc')
    const selfAdmin = db.setting('selfAdmin')
    const publicAdmin = db.setting('publicAdmin')
    const botAfk = db.setting('botAfk')
    
    if (botAfk && botAfk.active) {
        if (m.fromMe || m.isOwner) {
            return { allowed: true }
        }
        const duration = formatAfkDuration(Date.now() - botAfk.since)
        return { 
            allowed: false, 
            isAfk: true,
            afkMessage: `💤 *ʙᴏᴛ sᴇᴅᴀɴɢ ᴀꜰᴋ*\n\n` +
                `╭┈┈⬡「 📋 *ɪɴꜰᴏ* 」\n` +
                `┃ 📝 ᴀʟᴀsᴀɴ: \`${botAfk.reason || 'AFK'}\`\n` +
                `┃ ⏱️ sᴇᴊᴀᴋ: \`${duration}\` yang lalu\n` +
                `╰┈┈⬡\n\n` +
                `> Bot tidak bisa menerima perintah saat ini\n` +
                `> Mohon tunggu sampai owner mengaktifkan kembali`
        }
    }
    
    if (selfAdmin) {
        if (m.fromMe || m.isOwner) return { allowed: true }
        if (m.isGroup && m.isAdmin) return { allowed: true }
        return { allowed: false }
    }
    
    if (publicAdmin) {
        if (m.fromMe || m.isOwner) return { allowed: true }
        if (!m.isGroup) return { allowed: true }
        if (m.isGroup && m.isAdmin) return { allowed: true }
        return { allowed: false }
    }
    
    if (onlyGc && !m.isGroup && !m.isOwner) {
        return { allowed: false }
    }
    
    if (onlyPc && m.isGroup && !m.isOwner) {
        return { allowed: false }
    }
    
    if (mode === 'public') {
        return { allowed: true }
    }
    if (mode === 'self') {
        if (m.fromMe) return { allowed: true }
        if (m.isBot) return { allowed: true }
        if (m.isOwner) return { allowed: true }
        if (realConfig.isSelf && realConfig.isSelf(m.sender)) return { allowed: true }
        const senderNumber = m.sender?.replace(/[^0-9]/g, '') || ''
        const botNumber = realConfig.config.bot?.number?.replace(/[^0-9]/g, '') || ''
        if (botNumber && (senderNumber.includes(botNumber) || botNumber.includes(senderNumber))) {
            return { allowed: true }
        }
        const ownerNumbers = realConfig.config.owner?.number || []
        const isOwner = ownerNumbers.some(owner => {
            const cleanOwner = owner.replace(/[^0-9]/g, '')
            return senderNumber.includes(cleanOwner) || cleanOwner.includes(senderNumber)
        })
        
        if (isOwner) return { allowed: true }
        return { allowed: false }
    }
    
    return { allowed: true }
}

function formatAfkDuration(ms) {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days} hari ${hours % 24} jam`
    if (hours > 0) return `${hours} jam ${minutes % 60} menit`
    if (minutes > 0) return `${minutes} menit`
    return `${seconds} detik`
}


/**
 * Handler utama untuk memproses pesan
 * @param {Object} msg - Raw message dari Baileys
 * @param {Object} sock - Socket connection
 * @returns {Promise<void>}
 * @example
 * sock.ev.on('messages.upsert', async ({ messages }) => {
 *   await messageHandler(messages[0], sock);
 * });
 */
async function messageHandler(msg, sock) {
    try {
        const m = await serialize(sock, msg);
        
        if (!m) return;
        if (!m.message) return;
        const db = getDatabase();
        if (!db?.ready) {
            return;
        }
        
        const modeCheck = checkMode(m)
        if (!modeCheck.allowed) {
            if (modeCheck.isAfk && m.isCommand) {
                await m.reply(modeCheck.afkMessage)
            }
            return; 
        }
        
        if (m.isBanned) {
            logger.warn('Banned user', m.sender);
            return;
        }
        
        const msgKey = `${m.chat}_${m.sender}_${m.id}`;
        if (debounceMessage(msgKey)) {
            return;
        }
        
        if (config.features?.autoRead) {
            await sock.readMessages([m.key]);
        }
        if (!m.pushName || m.pushName === 'Unknown' || m.pushName.trim() === '') {
            if (!m.isCommand && !m.isBot && !m.fromMe) {
                return;
            }
            m.pushName = m.sender?.split('@')[0] || 'User';
        }
        
        db.setUser(m.sender, {
            name: m.pushName,
            lastSeen: new Date().toISOString()
        });
        
        if (m.isGroup && incrementChatCount) {
            try {
                incrementChatCount(m.chat, m.sender, db)
            } catch (e) {}
        }
        
        if (config.features?.logMessage) {
            let groupName = 'PRIVATE';
            if (m.isGroup) {
                const groupData = db.getGroup(m.chat);
                groupName = groupData?.name || 'Unknown Group';
                // Fetch metadata async without blocking - don't await
                if (groupName === 'Unknown Group' || groupName === 'Unknown') {
                    sock.groupMetadata(m.chat).then(meta => {
                        if (meta?.subject) db.setGroup(m.chat, { name: meta.subject });
                    }).catch(() => {});
                }
            }

            logMessage({
                chatType: m.isGroup ? 'group' : 'private',
                groupName: groupName,
                pushName: m.pushName,
                sender: m.sender,
                message: m.body
            });
        }
        
        if (checkAfk) {
            try {
                await checkAfk(m, sock)
            } catch (e) {}
        }
        
        if (m.isGroup) {
            cacheMessageForAntiRemove(m, sock, db)
            
            const antilinkTriggered = await handleAntilink(m, sock, db)
            if (antilinkTriggered) return
            
            if (isMuted && !m.isAdmin) {
                try {
                    if (isMuted(m.chat, m.sender, db)) {
                        await sock.sendMessage(m.chat, { delete: m.key })
                        return
                    }
                } catch (e) {}
            }
            
            if (checkSpam && !m.isAdmin) {
                try {
                    if (checkSpam(m, sock, db)) {
                        const delayKey = `${m.chat}_${m.sender}`
                        spamDelayTracker.set(delayKey, Date.now())
                        
                        const warnPlugin = require('../plugins/group/warn');
                        if (warnPlugin?.handler) {
                            m.text = 'Spam messages'
                            m.quoted = null
                            m.mentionedJid = [m.sender]
                        }
                        await sock.sendMessage(m.chat, {
                            text: `⚠️ @${m.sender.split('@')[0]} terdeteksi spam!\n> Response delay 3 detik diaktifkan.`,
                            mentions: [m.sender]
                        })
                    }
                } catch (e) {}
            }
            
            if (checkSlowmode && !m.isAdmin && !m.isCommand) {
                try {
                    const remaining = checkSlowmode(m, sock, db)
                    if (remaining) {
                        await sock.sendMessage(m.chat, { delete: m.key })
                        return
                    }
                } catch (e) {}
            }
        }
        
        if (addXp && m.body) {
            try {
                const oldXp = db.getUser(m.sender)?.xp || 0
                const newXp = addXp(m.sender, db, 5)
                if (checkLevelUp) {
                    const result = checkLevelUp(oldXp, newXp)
                    if (result.leveled) {
                        await sock.sendMessage(m.chat, {
                            text: `🎉 *ʟᴇᴠᴇʟ ᴜᴘ!*\n\n` +
                                `> @${m.sender.split('@')[0]} naik ke level *${result.newLevel}*!\n` +
                                `> Title: *${result.title}*`,
                            mentions: [m.sender]
                        })
                    }
                }
            } catch (e) {}
        }
        
        if (m.isGroup && isToxic && handleToxicMessage) {
            try {
                const groupData = db.getGroup(m.chat) || {}
                if (groupData.antitoxic && !m.isAdmin && !m.isOwner) {
                    const toxicWords = groupData.toxicWords || []
                    const result = isToxic(m.body, toxicWords)
                    if (result.toxic) {
                        await handleToxicMessage(m, sock, db, result.word)
                        return
                    }
                }
            } catch (e) {}
        }
        
        if (handleAutoAI && m.isGroup) {
            try {
                const aiHandled = await handleAutoAI(m, sock)
                if (aiHandled) return
            } catch (e) {} 
        }
        
        if (!m.isCommand) {
            if (checkStickerCommand && m.message?.stickerMessage) {
                try {
                    const stickerCmd = checkStickerCommand(m)
                    if (stickerCmd) {
                        m.isCommand = true
                        m.command = stickerCmd
                        m.prefix = '.'
                        m.text = stickerCmd
                        m.args = []
                    }
                } catch (e) {}
            }
            
            if (!m.isCommand) {
                const gameHandled = await handleGameAnswer(m, sock)
                if (gameHandled) return
                
                const smartHandled = await handleSmartTriggers(m, sock, db)
                if (smartHandled) return
                
                if (m.quoted?.id && global.ytdlSessions?.has(m.quoted.id)) {
                    try {
                        const ytmp4Plugin = require('../plugins/download/ytmp4')
                        if (ytmp4Plugin.handleReply) {
                            const handled = await ytmp4Plugin.handleReply(m, { sock })
                            if (handled) return
                        }
                    } catch (e) {}
                }
                
                if (m.quoted?.id && global.confessData?.has(m.quoted.id)) {
                    try {
                        const confessPlugin = require('../plugins/fun/confess')
                        if (confessPlugin.replyHandler) {
                            const handled = await confessPlugin.replyHandler(m, { sock })
                            if (handled) return
                        }
                    } catch (e) {}
                }
                
                try {
                    const tttPlugin = require('../plugins/game/tictactoe')
                    if (tttPlugin.answerHandler) {
                        const handled = await tttPlugin.answerHandler(m, sock)
                        if (handled) return
                    }
                } catch (e) {}
                
                try {
                    const suitPlugin = require('../plugins/game/suitpvp')
                    if (suitPlugin.answerHandler) {
                        const handled = await suitPlugin.answerHandler(m, sock)
                        if (handled) return
                    }
                } catch (e) {}
                
                try {
                    const utPlugin = require('../plugins/game/ulartangga')
                    if (utPlugin.answerHandler) {
                        const handled = await utPlugin.answerHandler(m, sock)
                        if (handled) return
                    }
                } catch (e) {}
                
                if (hasActiveSession(m.chat)) {
                    await handleGameAnswer(m, sock);
                }
                return;
            }
        }
        
        const delayKey = `${m.chat}_${m.sender}`
        const lastSpamDetect = spamDelayTracker.get(delayKey)
        if (lastSpamDetect) {
            const elapsed = Date.now() - lastSpamDetect
            if (elapsed < 60000) {
                await new Promise(r => setTimeout(r, 3000))
            } else {
                spamDelayTracker.delete(delayKey)
            }
        }
        
        if (isSpamming(m.sender)) {
            return;
        }
        
        const storeData = db.setting('storeList') || {}
        const storeCommand = storeData[m.command.toLowerCase()]
        
        if (m.isGroup) {
            const groupData = db.getGroup(m.chat) || {}
            const botMode = groupData.botMode || 'md'
            
            if (botMode === 'store' && storeCommand) {
                storeData[m.command.toLowerCase()].views = (storeCommand.views || 0) + 1
                db.setting('storeList', storeData)
                
                const caption = `📦 *${m.command.toUpperCase()}*\n\n` +
                    `${storeCommand.content}\n\n` +
                    `───────────────\n` +
                    `> 👁️ Views: ${storeData[m.command.toLowerCase()].views}\n` +
                    `> 💳 Ketik \`${m.prefix}payment\` untuk bayar`
                
                if (storeCommand.hasImage && storeCommand.imagePath) {
                    const fs = require('fs')
                    if (fs.existsSync(storeCommand.imagePath)) {
                        const imageBuffer = fs.readFileSync(storeCommand.imagePath)
                        await sock.sendMessage(m.chat, {
                            image: imageBuffer,
                            caption: caption
                        }, { quoted: m })
                        return
                    }
                }
                
                await m.reply(caption)
                return
            }
        }
        
        let plugin = getPlugin(m.command);
        
        if (!plugin) {
            if (storeCommand) {
                storeData[m.command.toLowerCase()].views = (storeCommand.views || 0) + 1
                db.setting('storeList', storeData)
                
                const caption = `📦 *${m.command.toUpperCase()}*\n\n` +
                    `${storeCommand.content}\n\n` +
                    `───────────────\n` +
                    `> 👁️ Views: ${storeData[m.command.toLowerCase()].views}\n` +
                    `> 💳 Ketik \`${m.prefix}payment\` untuk bayar`
                
                if (storeCommand.hasImage && storeCommand.imagePath) {
                    const fs = require('fs')
                    if (fs.existsSync(storeCommand.imagePath)) {
                        const imageBuffer = fs.readFileSync(storeCommand.imagePath)
                        await sock.sendMessage(m.chat, {
                            image: imageBuffer,
                            caption: caption
                        }, { quoted: m })
                        return
                    }
                }
                
                await m.reply(caption)
                return
            }
            
            const allCommands = []
            const plugins = getAllPlugins()
            
            for (const p of plugins) {
                if (p.config.isEnabled) {
                    const names = Array.isArray(p.config.name) ? p.config.name : [p.config.name]
                    allCommands.push(...names)
                    
                    if (p.config.alias) {
                        const aliases = Array.isArray(p.config.alias) ? p.config.alias : [p.config.alias]
                        allCommands.push(...aliases)
                    }
                }
            }
            
            const storeCommands = Object.keys(storeData)
            allCommands.push(...storeCommands)
            
            const suggestions = findSimilarCommands(m.command, allCommands, {
                maxResults: 3,
                minSimilarity: 0.35,
                maxDistance: 4
            })
            
            if (suggestions.length > 0) {
                const message = formatSuggestionMessage(m.command, suggestions, m.prefix)
                await m.reply(message)
            }
            
            return;
        }
        
        if (!plugin.config.isEnabled) {
            return;
        }
        
        if (m.isGroup) {
            const groupData = db.getGroup(m.chat) || {}
            const botMode = groupData.botMode || 'md'
            const pluginCategory = plugin.config.category?.toLowerCase()
            const baseAllowed = ['main', 'group', 'sticker', 'owner']
            
            const modeConfig = {
                md: { allowed: null, excluded: ['pushkontak', 'store', 'panel'], name: 'Multi Device' },
                cpanel: { allowed: [...baseAllowed, 'tools', 'panel'], name: 'CPanel' },
                pushkontak: { allowed: [...baseAllowed, 'pushkontak'], name: 'Push Kontak' },
                store: { allowed: [...baseAllowed, 'store'], name: 'Store' }
            }
            
            const categoryModeMap = {
                'download': 'md',
                'search': 'md',
                'ai': 'md',
                'fun': 'md',
                'game': 'md',
                'media': 'md',
                'utility': 'md',
                'tools': 'md',
                'ephoto': 'md',
                'religi': 'md',
                'info': 'md',
                'panel': 'cpanel',
                'pushkontak': 'pushkontak',
                'store': 'store',
                'jpm': 'md'
            }
            
            const currentConfig = modeConfig[botMode] || modeConfig.md
            
            if (m.command !== 'botmode' && m.command !== 'menu' && m.command !== 'menucat') {
                let isBlocked = false
                
                if (currentConfig.allowed && !currentConfig.allowed.includes(pluginCategory)) {
                    isBlocked = true
                }
                if (currentConfig.excluded && currentConfig.excluded.includes(pluginCategory)) {
                    isBlocked = true
                }
                
                if (isBlocked) {
                    const suggestedMode = categoryModeMap[pluginCategory] || 'md'
                    const suggestedModeName = modeConfig[suggestedMode]?.name || 'Multi Device'
                    
                    await m.reply(
                        `🔒 *ᴄᴏᴍᴍᴀɴᴅ ᴛɪᴅᴀᴋ ᴛᴇʀsᴇᴅɪᴀ*\n\n` +
                        `> Bot sedang dalam mode *${currentConfig.name}*\n` +
                        `> Command \`${m.prefix}${m.command}\` tersedia di mode *${suggestedModeName}*\n\n` +
                        `💡 Hubungi admin grup untuk mengganti mode:\n` +
                        `\`${m.prefix}botmode ${suggestedMode}\``
                    )
                    return
                }
            }
        }
        
        const permission = checkPermission(m, plugin.config);
        if (!permission.allowed) {
            await m.reply(permission.reason);
            return;
        }
        
        const user = db.getUser(m.sender);
        
        if (!m.isOwner && plugin.config.cooldown > 0) {
            const cooldownRemaining = db.checkCooldown(m.sender, m.command, plugin.config.cooldown);
            if (cooldownRemaining) {
                const cooldownMsg = (config.messages?.cooldown || '⏱️ Tunggu %time% detik')
                    .replace('%time%', cooldownRemaining);
                await m.reply(cooldownMsg);
                return;
            }
        }
        
        if (plugin.config.limit > 0) {
            const ownerLimit = config.limits?.owner ?? -1
            const premiumLimit = config.limits?.premium ?? 100
            
            if (m.isOwner && ownerLimit === -1) {
            } else if (m.isOwner) {
                const currentLimit = user?.limit || ownerLimit
                if (currentLimit < plugin.config.limit) {
                    await m.reply(config.messages?.limitExceeded || '📊 Limit habis!')
                    return
                }
                db.updateLimit(m.sender, -plugin.config.limit)
            } else if (m.isPremium) {
                const currentLimit = user?.limit || premiumLimit
                if (currentLimit < plugin.config.limit) {
                    await m.reply(config.messages?.limitExceeded || '📊 Limit habis!')
                    return
                }
                db.updateLimit(m.sender, -plugin.config.limit)
            } else {
                const currentLimit = user?.limit || 0
                if (currentLimit < plugin.config.limit) {
                    await m.reply(config.messages?.limitExceeded || '📊 Limit habis!')
                    return
                }
                db.updateLimit(m.sender, -plugin.config.limit)
            }
        }
        
        if (config.features?.autoTyping) {
            await sock.sendPresenceUpdate('composing', m.chat);
        }
        
        const context = {
            sock,
            m,
            config,
            db,
            uptime: getUptime(),
            plugins: {
                count: getPluginCount()
            }
        };
        
        // Log command execution with box style
        const chatType = m.isGroup ? 'group' : 'private';
        logCommand(`${m.prefix}${m.command}`, m.pushName, chatType);
        
        await plugin.handler(m, context);
        
        if (!m.isOwner && plugin.config.cooldown > 0) {
            db.setCooldown(m.sender, m.command, plugin.config.cooldown);
        }
        
        db.incrementStat('commandsExecuted');
        db.incrementStat(`command_${m.command}`);
        
        if (config.features?.autoTyping) {
            await sock.sendPresenceUpdate('paused', m.chat);
        }
        
    } catch (error) {
        logger.error('Handler', error.message);
        
        try {
            const m = await serialize(sock, msg);
            if (m) {
                await m.reply(createErrorMessage('Terjadi kesalahan saat memproses command!'));
            }
        } catch {
            logger.error('Failed to send error message');
        }
    }
}

/**
 * Handler untuk update group participants
 * @param {Object} update - Update data
 * @param {Object} sock - Socket connection
 * @returns {Promise<void>}
 */
async function groupHandler(update, sock) {
    try {
        if (global.sewaLeaving) return
        
        const { id: groupJid, participants, action } = update
        
        const db = getDatabase()
        
        let groupData = db.getGroup(groupJid)
        if (!groupData) {
            db.setGroup(groupJid, {
                welcome: config.welcome?.defaultEnabled ?? true,
                goodbye: config.goodbye?.defaultEnabled ?? true,
                leave: config.goodbye?.defaultEnabled ?? true
            })
            groupData = db.getGroup(groupJid)
        }
        
        let groupMeta
        try {
            groupMeta = await sock.groupMetadata(groupJid)
        } catch (e) {
            if (e.message?.includes('forbidden') || e.message?.includes('401') || e.message?.includes('403')) {
                return
            }
            throw e
        }
        
        let sendWelcomeMessage, sendGoodbyeMessage
        try {
            sendWelcomeMessage = require('../plugins/group/welcome').sendWelcomeMessage
            sendGoodbyeMessage = require('../plugins/group/goodbye').sendGoodbyeMessage
        } catch (e) {}
        
        for (let participant of participants) {
            if (isLid(participant) || isLidConverted(participant)) {
                const found = groupMeta.participants?.find(p => 
                    p.id === participant || p.lid === participant ||
                    p.lid === participant.replace('@s.whatsapp.net', '@lid')
                );
                if (found) {
                    participant = (found.jid && !found.jid.endsWith('@lid') && !isLidConverted(found.jid)) 
                                  ? found.jid 
                                  : (found.id && !found.id.endsWith('@lid') && !isLidConverted(found.id))
                                    ? found.id
                                    : lidToJid(participant);
                } else {
                    participant = lidToJid(participant);
                }
            }
            
            if (action === 'add' && sendWelcomeMessage) {
                await sendWelcomeMessage(sock, groupJid, participant, groupMeta)
            }
            
            if (action === 'remove' && sendGoodbyeMessage) {
                await sendGoodbyeMessage(sock, groupJid, participant, groupMeta)
            }
            
            const saluranId = config.saluran?.id || '120363208449943317@newsletter'
            const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
            
            let groupPpUrl = 'https://files.catbox.moe/w4e75f.jpg'
            try {
                groupPpUrl = await sock.profilePictureUrl(groupJid, 'image') || groupPpUrl
            } catch (e) {}
            
            if (action === 'promote') {
                const author = update.author || null
                let promotedBy = ''
                if (author) {
                    try {
                        const authorName = await sock.getName(author)
                        promotedBy = authorName || author.split('@')[0]
                    } catch {
                        promotedBy = author.split('@')[0]
                    }
                }
                
                await sock.sendMessage(groupJid, {
                    text: `╭━━━━━━━━━━━━━━━━━╮\n` +
                        `┃  👑 *ᴘʀᴏᴍᴏᴛᴇ*\n` +
                        `╰━━━━━━━━━━━━━━━━━╯\n\n` +
                        `┃ 👤 User: @${participant.split('@')[0]}\n` +
                        `┃ ⚡ Status: *Admin Baru*\n` +
                        (author ? `┃ 🔧 Oleh: @${author.split('@')[0]}\n\n` : '\n') +
                        `> 🎉 _Selamat atas jabatan barunya!_`,
                    mentions: author ? [participant, author] : [participant],
                    contextInfo: {
                        mentionedJid: author ? [participant, author] : [participant],
                        forwardingScore: 9999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: saluranId,
                            newsletterName: saluranName,
                            serverMessageId: 127
                        },
                        externalAdReply: {
                            showAdAttribution: false,
                            title: '👑 PROMOTE',
                            body: `${participant.split('@')[0]} menjadi Admin`,
                            thumbnailUrl: groupPpUrl,
                            mediaType: 1,
                            renderLargerThumbnail: false,
                            sourceUrl: ''
                        }
                    }
                })
            }
            
            if (action === 'demote') {
                const author = update.author || null
                
                await sock.sendMessage(groupJid, {
                    text: `╭━━━━━━━━━━━━━━━━━╮\n` +
                        `┃  📉 *ᴅᴇᴍᴏᴛᴇ*\n` +
                        `╰━━━━━━━━━━━━━━━━━╯\n\n` +
                        `┃ 👤 User: @${participant.split('@')[0]}\n` +
                        `┃ ⚡ Status: *Bukan Admin*\n` +
                        (author ? `┃ 🔧 Oleh: @${author.split('@')[0]}\n\n` : '\n') +
                        `> 🙏 _Terima kasih atas kontribusinya!_`,
                    mentions: author ? [participant, author] : [participant],
                    contextInfo: {
                        mentionedJid: author ? [participant, author] : [participant],
                        forwardingScore: 9999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: saluranId,
                            newsletterName: saluranName,
                            serverMessageId: 127
                        },
                        externalAdReply: {
                            showAdAttribution: false,
                            title: '📉 DEMOTE',
                            body: `${participant.split('@')[0]} bukan Admin lagi`,
                            thumbnailUrl: groupPpUrl,
                            mediaType: 1,
                            renderLargerThumbnail: false,
                            sourceUrl: ''
                        }
                    }
                })
            }
        }
        
    } catch (error) {
        console.error('[GroupHandler] Error:', error.message)
    }
}

async function messageUpdateHandler(updates, sock) {
    const db = getDatabase()
    
    for (const update of updates) {
        try {
            await handleAntiRemove(update, sock, db)
        } catch (error) {
            continue
        }
    }
}

/**
 * Cache untuk menyimpan state terakhir grup
 * Format: { groupId: { announce: boolean, restrict: boolean, lastUpdate: timestamp } }
 */
const groupSettingsCache = new Map()

/**
 * Debounce cooldown untuk mencegah spam (dalam ms)
 */
const GROUP_SETTINGS_COOLDOWN = 1000

async function groupSettingsHandler(update, sock) {
    try {
        if (global.sewaLeaving) return
        if (global.isFetchingGroups) return
        
        const groupId = update.id
        if (!groupId || !groupId.endsWith('@g.us')) return
        
        if (update.announce === undefined && update.restrict === undefined) {
            return
        }
        
        const cached = groupSettingsCache.get(groupId) || {}
        const now = Date.now()
        
        if (cached.lastUpdate && (now - cached.lastUpdate) < GROUP_SETTINGS_COOLDOWN) {
            return
        }
        
        let hasRealChange = false
        if (update.announce !== undefined) {
            if (cached.announce === undefined) {
                cached.announce = update.announce
            } else if (cached.announce !== update.announce) {
                hasRealChange = true
                
                const saluranId = config.saluran?.id || '120363208449943317@newsletter'
                const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
                
                if (update.announce === true) {
                    await sock.sendMessage(groupId, {
                        text: `╭━━━━━━━━━━━━━━━━━╮\n` +
                            `┃  🔒 *ɢʀᴜᴘ ᴅɪᴛᴜᴛᴜᴘ*\n` +
                            `╰━━━━━━━━━━━━━━━━━╯\n\n` +
                            `> Grup sekarang *ditutup*.\n` +
                            `> Hanya admin yang bisa\n` +
                            `> mengirim pesan.\n\n` +
                            `> _Admin dapat membuka dengan_\n` +
                            `> _\`.group open\`_`,
                        contextInfo: {
                            forwardingScore: 9999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: saluranId,
                                newsletterName: saluranName,
                                serverMessageId: 127
                            }
                        }
                    })
                } else {
                    await sock.sendMessage(groupId, {
                        text: `╭━━━━━━━━━━━━━━━━━╮\n` +
                            `┃  🔓 *ɢʀᴜᴘ ᴅɪʙᴜᴋᴀ*\n` +
                            `╰━━━━━━━━━━━━━━━━━╯\n\n` +
                            `> Grup sekarang *dibuka*.\n` +
                            `> Semua member bisa\n` +
                            `> mengirim pesan.\n\n` +
                            `> _Selamat berkirim pesan! 💬_`,
                        contextInfo: {
                            forwardingScore: 9999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: saluranId,
                                newsletterName: saluranName,
                                serverMessageId: 127
                            }
                        }
                    })
                }
                
                cached.announce = update.announce
            }
        }
        
        if (update.restrict !== undefined) {
            if (cached.restrict === undefined) {
                cached.restrict = update.restrict
            } else if (cached.restrict !== update.restrict) {
                hasRealChange = true
                const saluranIdR = config.saluran?.id || '120363208449943317@newsletter'
                const saluranNameR = config.saluran?.name || config.bot?.name || 'Ourin-AI'
                
                if (update.restrict === true) {
                    await sock.sendMessage(groupId, {
                        text: `╭━━━━━━━━━━━━━━━━━╮\n` +
                            `┃  ⚙️ *ɪɴꜰᴏ ɢʀᴜᴘ*\n` +
                            `╰━━━━━━━━━━━━━━━━━╯\n\n` +
                            `> Info grup sekarang *terbatas*.\n` +
                            `> Hanya admin yang bisa\n` +
                            `> edit info grup.`,
                        contextInfo: {
                            forwardingScore: 9999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: saluranIdR,
                                newsletterName: saluranNameR,
                                serverMessageId: 127
                            }
                        }
                    })
                } else {
                    await sock.sendMessage(groupId, {
                        text: `╭━━━━━━━━━━━━━━━━━╮\n` +
                            `┃  ⚙️ *ɪɴꜰᴏ ɢʀᴜᴘ*\n` +
                            `╰━━━━━━━━━━━━━━━━━╯\n\n` +
                            `> Info grup sekarang *terbuka*.\n` +
                            `> Semua member bisa\n` +
                            `> edit info grup.`,
                        contextInfo: {
                            forwardingScore: 9999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: saluranIdR,
                                newsletterName: saluranNameR,
                                serverMessageId: 127
                            }
                        }
                    })
                }
                cached.restrict = update.restrict
            }
        }
        if (hasRealChange) {
            cached.lastUpdate = now
        }
        if (cached.announce !== undefined || cached.restrict !== undefined) {
            groupSettingsCache.set(groupId, cached)
        }
        
    } catch (error) {
        console.error('[GroupSettings] Error:', error.message)
    }
}

module.exports = {
    messageHandler,
    groupHandler,
    messageUpdateHandler,
    groupSettingsHandler,
    checkPermission,
    checkMode,
    isSpamming
};
