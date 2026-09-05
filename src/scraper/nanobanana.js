const axios = require('axios')
const FormData = require('form-data')
const crypto = require('crypto')

const headers = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36',
    'Accept': '*/*',
    'Accept-Language': 'id-ID,id;q=0.7',
    'Origin': 'https://nano-banana-pro.co',
    'Referer': 'https://nano-banana-pro.co/',
    'sec-ch-ua-platform': '"Android"',
    'sec-ch-ua-mobile': '?1',
    'sec-gpc': '1',
    'priority': 'u=1, i'
}

async function createTempMail() {
    try {
        const r = await axios.get('https://api.nekolabs.web.id/tools/tempmail/v1/create')
        return r.data?.result || null
    } catch {
        return null
    }
}

async function checkInbox(id) {
    try {
        const r = await axios.get(`https://api.nekolabs.web.id/tools/tempmail/v1/inbox?id=${id}`)
        return r.data?.result || null
    } catch {
        return null
    }
}

async function nanoBanana(imageBuffer, prompt) {
    const emailData = await createTempMail()
    if (!emailData) {
        throw new Error('Gagal membuat temporary email')
    }

    const { email, sessionId } = emailData
    const password = 'Pass' + crypto.randomBytes(4).toString('hex') + '!'
    const name = 'User' + crypto.randomBytes(2).toString('hex')

    await axios.post('https://nano-banana-pro.co/api/auth/sign-up/email', {
        email, password, name
    }, { headers: { ...headers, 'Content-Type': 'application/json' } })

    let verifyLink = null
    let attempts = 0

    while (attempts < 20 && !verifyLink) {
        await new Promise(r => setTimeout(r, 3000))
        const inbox = await checkInbox(sessionId)
        if (inbox?.emails?.length) {
            const body = inbox.emails[0].text || inbox.emails[0].html || ''
            const match = body.match(/https:\/\/nano-banana-pro\.co\/api\/auth\/verify-email\?token=[^\s"]+/)
            if (match) verifyLink = match[0]
        }
        attempts++
    }

    if (!verifyLink) {
        throw new Error('Timeout verifikasi email')
    }

    const verifyRes = await axios.get(verifyLink, { 
        headers, 
        maxRedirects: 0,
        validateStatus: () => true
    })
    
    const rawCookies = verifyRes.headers['set-cookie']
    const cookie = rawCookies ? rawCookies.map(v => v.split(';')[0]).join('; ') : ''

    if (!cookie) {
        throw new Error('Cookie tidak ditemukan')
    }

    const form = new FormData()
    form.append('files', imageBuffer, { filename: 'image.jpg', contentType: 'image/jpeg' })

    const upRes = await axios.post('https://nano-banana-pro.co/api/storage/upload-image', form, {
        headers: { ...headers, 'Cookie': cookie, ...form.getHeaders() }
    })

    const uploadedUrl = upRes.data?.data?.urls?.[0]
    if (!uploadedUrl) {
        throw new Error('Upload gambar gagal')
    }

    const payload = {
        mediaType: 'image',
        scene: 'image-to-image',
        provider: 'kie',
        model: 'nano-banana',
        prompt: prompt,
        options: { image_input: [uploadedUrl] }
    }

    const genRes = await axios.post('https://nano-banana-pro.co/api/ai/generate', payload, {
        headers: { ...headers, 'Content-Type': 'application/json', 'Cookie': cookie }
    })

    const taskId = genRes.data?.data?.id
    if (!taskId) {
        throw new Error('Gagal mendapatkan task ID')
    }

    let resultImg = null
    let poll = 0

    while (poll < 60 && !resultImg) {
        await new Promise(r => setTimeout(r, 4000))

        const qRes = await axios.post('https://nano-banana-pro.co/api/ai/query', 
            { taskId },
            { 
                headers: { ...headers, 'Content-Type': 'application/json', 'Cookie': cookie },
                responseType: 'arraybuffer'
            }
        )

        const contentType = qRes.headers['content-type'] || ''

        if (contentType.includes('image')) {
            resultImg = Buffer.from(qRes.data)
            break
        }

        let json
        try {
            json = JSON.parse(Buffer.from(qRes.data).toString())
        } catch {
            poll++
            continue
        }

        const taskStr = json?.data?.taskResult
        if (!taskStr) {
            poll++
            continue
        }

        let task
        try { 
            task = JSON.parse(taskStr) 
        } catch {
            poll++
            continue
        }

        if (['waiting', 'pending'].includes(task.state)) {
            poll++
            continue
        }

        if (['failed', 'error'].includes(task.state)) {
            throw new Error(`Task gagal: ${task.failMsg || 'Unknown error'}`)
        }

        if (['success', 'completed'].includes(task.state)) {
            const res = JSON.parse(task.resultJson || '{}')
            const url = res?.resultUrls?.[0]
            if (!url) {
                throw new Error('URL hasil tidak ditemukan')
            }
            const dl = await axios.get(url, { responseType: 'arraybuffer' })
            resultImg = Buffer.from(dl.data)
            break
        }

        poll++
    }

    if (!resultImg) {
        throw new Error('Timeout: proses terlalu lama')
    }

    return resultImg
}

module.exports = nanoBanana