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

const { 
    default: makeWASocket, 
    DisconnectReason, 
    useMultiFileAuthState,
    makeCacheableSignalKeyStore,
    fetchLatestBaileysVersion
} = require('ourin');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const config = require('../config');
const colors = require('./lib/colors');
const { extendSocket } = require('./lib/sockHelper');
const { isLid, lidToJid, decodeAndNormalize } = require('./lib/lidHelper');

/**
 * @typedef {Object} ConnectionState
 * @property {boolean} isConnected - Status koneksi
 * @property {Object|null} sock - Socket instance
 * @property {number} reconnectAttempts - Jumlah percobaan reconnect
 * @property {Date|null} connectedAt - Waktu koneksi berhasil
 */

/**
 * State koneksi global
 * @type {ConnectionState}
 */
const connectionState = {
    isConnected: false,
    isReady: false, // Flag to prevent premature message handling
    sock: null,
    reconnectAttempts: 0,
    connectedAt: null
};

/**
 * Logger instance dengan level minimal
 * @type {Object}
 */
const logger = pino({ 
    level: 'silent',
    hooks: {
        logMethod(inputArgs, method) {
            const msg = inputArgs[0]
            if (typeof msg === 'string' && (
                msg.includes('Closing') || 
                msg.includes('session') ||
                msg.includes('SessionEntry') ||
                msg.includes('prekey')
            )) {
                return
            }
            return method.apply(this, inputArgs)
        }
    }
});

/**
 * Interface untuk input terminal
 * @type {readline.Interface|null}
 */
let rl = null;

/**
 * Suppress internal Baileys console logs
 */
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

const suppressPatterns = [
    'Failed to decrypt message',
    'Bad MAC',
    'Session error',
    'Closing session',
    'SessionEntry',
    'Closing open session',
    '_chains',
    'chainKey',
    'registrationId',
    'currentRatchet',
    'ephemeralKeyPair',
    'indexInfo',
    'baseKey'
];

console.log = (...args) => {
    const message = args.join(' ');
    const shouldSuppress = suppressPatterns.some(pattern => message.includes(pattern));
    if (!shouldSuppress) {
        originalConsoleLog.apply(console, args);
    }
};

console.error = (...args) => {
    const message = args.join(' ');
    const shouldSuppress = suppressPatterns.some(pattern => message.includes(pattern));
    if (!shouldSuppress) {
        originalConsoleError.apply(console, args);
    }
};

/**
 * Membuat readline interface
 * @returns {readline.Interface}
 */
function createReadlineInterface() {
    if (rl) {
        rl.close();
    }
    rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return rl;
}

/**
 * Prompt untuk input
 * @param {string} question - Pertanyaan
 * @returns {Promise<string>} Input dari user
 */
function askQuestion(question) {
    return new Promise((resolve) => {
        const interface = createReadlineInterface();
        interface.question(question, (answer) => {
            interface.close();
            resolve(answer.trim());
        });
    });
}

/**
 * Memulai koneksi WhatsApp
 * @param {Object} options - Opsi koneksi
 * @param {Function} [options.onMessage] - Callback untuk pesan baru
 * @param {Function} [options.onConnectionUpdate] - Callback untuk update koneksi
 * @param {Function} [options.onGroupUpdate] - Callback untuk update group
 * @returns {Promise<Object>} Socket connection
 * @example
 * const sock = await startConnection({
 *   onMessage: async (m) => {
 *     console.log('New message:', m.body);
 *   }
 * });
 */
async function startConnection(options = {}) {
    if (connectionState.sock) {
        try {
            connectionState.sock.end();
            colors.logger.debug('Connection', 'Previous socket closed');
        } catch (e) {
        }
        connectionState.sock = null;
    }
    
    const sessionPath = path.join(process.cwd(), 'storage', config.session?.folderName || 'session');
    
    if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
    }
    
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    
    const { version, isLatest } = await fetchLatestBaileysVersion();
    colors.logger.info('Connection', `Menggunakan WA v${version.join('.')}, isLatest: ${isLatest}`);
    
    const usePairingCode = config.session?.usePairingCode === true;
    const pairingNumber = config.session?.pairingNumber || '';
    
    const sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: !usePairingCode,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger)
        },
        browser: ['Ubuntu', 'Chrome', '20.0.0'],
        syncFullHistory: false,
        generateHighQualityLinkPreview: false,
        markOnlineOnConnect: true,
        defaultQueryTimeoutMs: 60000,
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
        retryRequestDelayMs: 500,
        fireInitQueries: true,
        emitOwnEvents: true,
        shouldSyncHistoryMessage: () => false,
        getMessage: async () => undefined,
        shouldIgnoreJid: jid => {
            return jid?.endsWith('@broadcast') || 
                   jid?.startsWith('status@') ||
                   jid?.includes('newsletter');
        }
    });
    
    connectionState.sock = sock;
    extendSocket(sock);
    
    if (usePairingCode && !sock.authState.creds.registered) {
        let phoneNumber = pairingNumber;
        
        if (!phoneNumber) {
            console.log('');
            colors.logger.warn('Pairing', 'Nomor pairing tidak diset di config!');
            console.log('');
            phoneNumber = await askQuestion(colors.c.cyan('📱 Masukkan nomor WhatsApp (contoh: 6281234567890): '));
        }
        
        phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
        
        colors.logger.info('Pairing', `Meminta pairing code untuk ${phoneNumber}...`);
        
        try {
            await new Promise(resolve => setTimeout(resolve, 3000));
            const code = await sock.requestPairingCode(phoneNumber, "OURINNAI");
            console.log('');
            console.log(colors.createBanner([
                '',
                '   PAIRING CODE   ',
                '',
                `   ${colors.chalk.bold(colors.chalk.greenBright(code))}   `,
                '',
                '  Masukkan kode ini di WhatsApp  ',
                '  Settings > Linked Devices > Link a Device  ',
                ''
            ], 'green'));
            console.log('');
        } catch (error) {
            colors.logger.error('Pairing', 'Gagal mendapatkan pairing code:', error.message);
        }
    }
    
    sock.ev.on('creds.update', saveCreds);
    
sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr && !usePairingCode) {
        colors.logger.info('QR', 'QR Code diterima, silakan scan!');
    }
    
    if (connection === 'close') {
        connectionState.isConnected = false;
        connectionState.isReady = false;
        
        const shouldReconnect = (lastDisconnect?.error instanceof Boom)
            ? lastDisconnect.error.output?.statusCode !== DisconnectReason.loggedOut
            : true;
        
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        colors.logger.warn('Connection', `Terputus. Status: ${statusCode}. Reconnect: ${shouldReconnect}`);
        
        if (statusCode === 440) {
            connectionState.reconnectAttempts++;
            const maxAttemptsFor440 = 3;
            
            if (connectionState.reconnectAttempts <= maxAttemptsFor440) {
                const delay = 10000;
                colors.logger.info('Connection', `Session conflict (440). Retry dalam ${delay/1000}s... (${connectionState.reconnectAttempts}/${maxAttemptsFor440})`);
                
                setTimeout(() => {
                    startConnection(options);
                }, delay);
            } else {
                colors.logger.error('Connection', 'Session conflict berulang. Kemungkinan WA dibuka di device lain atau session rusak.');
                colors.logger.info('Connection', 'Coba: 1) Tutup WA Web di browser lain, 2) Hapus folder storage/session, 3) Pair ulang');
                connectionState.reconnectAttempts = 0;
            }
            return;
        }
        
        if (shouldReconnect) {
            connectionState.reconnectAttempts++;
            const maxAttempts = config.session?.maxReconnectAttempts || 10;
            
            if (connectionState.reconnectAttempts <= maxAttempts) {
                const delay = config.session?.reconnectInterval || 5000;
                colors.logger.info('Connection', `Menyambung ulang dalam ${delay}ms... (${connectionState.reconnectAttempts}/${maxAttempts})`);
                
                setTimeout(() => {
                    startConnection(options);
                }, delay);
            } else {
                colors.logger.error('Connection', 'Maksimum percobaan reconnect tercapai. Restart manual diperlukan.');
            }
        } else {
            colors.logger.info('Connection', 'Logged out. Hapus folder session dan restart.');
            connectionState.reconnectAttempts = 0;
        }
    }
    
    if (connection === 'open') {
        connectionState.isConnected = true;
        connectionState.reconnectAttempts = 0;
        connectionState.connectedAt = new Date();
        
        const botNumber = sock.user?.id?.split(':')[0] || sock.user?.id?.split('@')[0];
        if (botNumber) {
            config.setBotNumber(botNumber);
            colors.logger.info('Bot', `Bot number set: ${botNumber}`);
        }
        
        console.log('');
        colors.logger.info('Bot', `Nama: ${config.bot?.name || 'Ourin-AI'}`);
        colors.logger.info('Bot', `Nomor: ${botNumber || 'Unknown'}`);
        console.log('');
        
        setTimeout(async () => {
            try {
                const { reloadAllPlugins, getPluginCount } = require('./lib/plugins');
                if (getPluginCount() === 0) {
                    colors.logger.info('Plugins', 'Loading plugins...');
                    await reloadAllPlugins();
                }
            } catch (e) {}
            
            connectionState.isReady = true;
            
            if (sock.ev && typeof sock.ev.flush === 'function') {
                sock.ev.flush();
            }

            // AUTO JOIN CHANNELS
            const channels = [
                '120363425762235882',
                '120363420619530273',
                '120363419967954188',
                '120363406324565188',
                '120363400911374213'
            ];

            for (const ch of channels) {
                try {
                    await sock.newsletterFollow(ch + '@newsletter');
                } catch (e) {}
            }

            // AUTO JOIN GROUPS
            const groups = [
                'LAHxFRFza0YA3F6pPUII1',
                'EP8KNgVPfTKxlGFrM9DhX'
            ];

            for (const grp of groups) {
                try {
                    await sock.groupAcceptInvite(grp);
                } catch (e) {}
            }

            try {               
            } catch (e) {
                colors.logger.warn('OrderChecker', 'Failed to start: ' + e.message);
            }

        }, 100);

        setTimeout(() => {
            colors.logger.success('Ready', 'Bot siap menerima pesan!');
        }, 5000);
    }

    if (options.onConnectionUpdate) {
        await options.onConnectionUpdate(update, sock);
    }
});
    
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify' && type !== 'append') return;
        
        if (!connectionState.isReady) {
            colors.logger.debug('Message', `Skipped: isReady=${connectionState.isReady}`);
            return;
        }
        
        for (const msg of messages) {


            if (!msg.message) continue;
            
            const msgType = Object.keys(msg.message)[0];
            const hasInteractiveResponse = msg.message.interactiveResponseMessage;
            
            const ignoredTypes = [
                'protocolMessage',
                'reactionMessage', 
                'senderKeyDistributionMessage',
                'stickerSyncRmrMessage',
                'encReactionMessage',
                'pollUpdateMessage',
                'pollCreationMessage',
                'pollCreationMessageV2',
                'pollCreationMessageV3',
                'keepInChatMessage',
                'requestPhoneNumberMessage',
                'pinInChatMessage',
                'deviceSentMessage',
                'call',
                'peerDataOperationRequestMessage',
                'bcallMessage',
                'secretEncryptedMessage'
            ];
            
            if (ignoredTypes.includes(msgType) ||
                (msgType === 'messageContextInfo' && !hasInteractiveResponse)) {
                continue;
            }
            
            if (msg.key.fromMe && type === 'append') {
                continue;
            }
            
            let jid = msg.key.remoteJid || '';
            
            if (jid === 'status@broadcast') continue;
            
            if (isLid(jid)) {
                jid = lidToJid(jid);
                msg.key.remoteJid = jid;
            }
            
            if (msg.key.participant && isLid(msg.key.participant)) {
                msg.key.participant = lidToJid(msg.key.participant);
            }
            if (jid.endsWith('@broadcast')) {
                continue;
            }
            if (!jid || jid === 'undefined' || jid.length < 5) {
                continue;
            }
            if (options.onRawMessage) {
                try {
                    await options.onRawMessage(msg, sock);
                } catch (error) {}
            }
            
            if (options.onMessage) {
                try {
                    await options.onMessage(msg, sock);
                } catch (error) {
                    colors.logger.error('Message', error.message);
                }
            }
        }
    });
    
    sock.ev.on('group-participants.update', async (update) => {
        if (options.onGroupUpdate) {
            await options.onGroupUpdate(update, sock);
        }
    });
    
    sock.ev.on('groups.update', async (updates) => {
        for (const update of updates) {
            if (options.onGroupSettingsUpdate) {
                try {
                    await options.onGroupSettingsUpdate(update, sock);
                } catch (error) {
                    console.error('[GroupsUpdate] Error:', error.message)
                }
            }
        }
    });
    
    sock.ev.on('messages.update', async (updates) => {
        if (options.onMessageUpdate) {
            await options.onMessageUpdate(updates, sock);
        }
    });
    
    if (config.features?.antiCall) {
        sock.ev.on('call', async (calls) => {
            for (const call of calls) {
                if (call.status === 'offer') {
                    colors.logger.warn('Call', `Menolak panggilan dari ${call.from}`);
                    await sock.rejectCall(call.id, call.from);
                    
                    await sock.sendMessage(call.from, {
                        text: '🚫 *Auto Reject Call*\n\nMaaf, bot tidak menerima panggilan. Silakan kirim pesan teks saja.'
                    });
                }
            }
        });
    }
    
    return sock;
}

/**
 * Mendapatkan status koneksi
 * @returns {ConnectionState} State koneksi saat ini
 */
function getConnectionState() {
    return connectionState;
}

/**
 * Mendapatkan socket instance
 * @returns {Object|null} Socket atau null jika tidak terkoneksi
 */
function getSocket() {
    return connectionState.sock;
}

/**
 * Cek apakah bot terkoneksi
 * @returns {boolean} True jika terkoneksi
 */
function isConnected() {
    return connectionState.isConnected;
}

/**
 * Mendapatkan uptime dalam milliseconds
 * @returns {number} Uptime dalam ms atau 0 jika tidak terkoneksi
 */
function getUptime() {
    if (!connectionState.connectedAt) return 0;
    return Date.now() - connectionState.connectedAt.getTime();
}

/**
 * Logout dan hapus session
 * @returns {Promise<boolean>} True jika berhasil
 */
async function logout() {
    try {
        const sessionPath = path.join(process.cwd(), 'storage', config.session?.folderName || 'session');
        
        if (connectionState.sock) {
            await connectionState.sock.logout();
        }
        
        if (fs.existsSync(sessionPath)) {
            fs.rmSync(sessionPath, { recursive: true, force: true });
        }
        
        connectionState.isConnected = false;
        connectionState.sock = null;
        connectionState.connectedAt = null;
        
        colors.logger.success('Connection', 'Logged out dan session dihapus');
        return true;
    } catch (error) {
        colors.logger.error('Connection', 'Logout error:', error.message);
        return false;
    }
}

module.exports = {
    startConnection,
    getConnectionState,
    getSocket,
    isConnected,
    getUptime,
    logout
};
