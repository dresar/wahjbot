const config = require('../../config');
const { getDatabase } = require('../../src/lib/database');

const pluginConfig = {
    name: 'setreply',
    alias: ['replyvariant', 'replystyle'],
    category: 'owner',
    description: 'Mengatur variant tampilan reply',
    usage: '.setreply <v1/v2/v3/v4>',
    example: '.setreply v3',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    limit: 0,
    isEnabled: true
};

const VARIANTS = {
    v1: { id: 1, name: 'Simple', desc: 'Reply text biasa' },
    v2: { id: 2, name: 'Context', desc: 'Reply dengan externalAdReply' },
    v3: { id: 3, name: 'Forward', desc: 'Full contextInfo + forwardedNewsletter' },
    v4: { id: 4, name: 'Qkontak', desc: 'V3 + fake quoted reply (centang biru)' }
};

async function handler(m, { sock, db }) {
    const args = m.args || [];
    const variant = args[0]?.toLowerCase();
    
    if (!variant) {
        const current = db.setting('replyVariant') || config.ui?.replyVariant || 1;
        
        let txt = `💬 *sᴇᴛ ʀᴇᴘʟʏ ᴠᴀʀɪᴀɴᴛ*\n\n`;
        txt += `> Variant saat ini: *V${current}*\n\n`;
        txt += `\`\`\`━━━ ᴘɪʟɪʜᴀɴ ━━━\`\`\`\n`;
        
        for (const [key, val] of Object.entries(VARIANTS)) {
            const mark = val.id === current ? ' ✓' : '';
            txt += `> *${key.toUpperCase()}*${mark}\n`;
            txt += `> _${val.desc}_\n\n`;
        }
        
        txt += `_Gunakan: \`.setreply v1\` s/d \`.setreply v4\`_`;
        
        await m.reply(txt);
        return;
    }
    
    const selected = VARIANTS[variant];
    if (!selected) {
        await m.reply(`❌ Variant tidak valid!\n\nGunakan: v1, v2, v3, atau v4`);
        return;
    }
    
    db.setting('replyVariant', selected.id);
    
    await m.reply(
        `✅ Reply variant diubah ke *V${selected.id}*\n\n` +
        `> *${selected.name}*\n` +
        `> _${selected.desc}_`
    );
}

module.exports = {
    config: pluginConfig,
    handler
};
