const axios = require('axios')

async function tiktokDl(url) {
    try {
        let data = []
        
        function formatNumber(integer) {
            let numb = parseInt(integer) || 0
            return Number(numb).toLocaleString().replace(/,/g, '.')
        }
        
        function formatDate(n, locale = 'en') {
            let d = new Date(n * 1000)
            return d.toLocaleDateString(locale, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric'
            })
        }
        
        function fixUrl(path) {
            if (!path) return ''
            if (path.startsWith('http')) return path
            return 'https://www.tikwm.com' + path
        }
        
        let domain = 'https://www.tikwm.com/api/'
        let res = await axios.post(domain, {}, {
            headers: {
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Origin': 'https://www.tikwm.com',
                'Referer': 'https://www.tikwm.com/',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36'
            },
            params: {
                url: url,
                count: 12,
                cursor: 0,
                web: 1,
                hd: 1
            },
            timeout: 30000
        })
        
        const result = res.data?.data
        if (!result) throw new Error('Data tidak ditemukan')
        
        console.log('[TikTok] Response duration:', result.duration)
        console.log('[TikTok] Response play:', result.play)
        console.log('[TikTok] Response hdplay:', result.hdplay)
        
        if (result?.duration === 0 && result?.images && result.images.length > 0) {
            result.images.map(v => {
                data.push({ type: 'photo', url: fixUrl(v) })
            })
        } else {
            data.push({
                type: 'watermark',
                url: fixUrl(result?.wmplay)
            }, {
                type: 'nowatermark',
                url: fixUrl(result?.play)
            }, {
                type: 'nowatermark_hd',
                url: fixUrl(result?.hdplay)
            })
        }
        
        console.log('[TikTok] Data URLs:', data.map(d => d.url))
        
        return {
            status: true,
            title: result.title || '',
            taken_at: formatDate(result.create_time).replace('1970', ''),
            region: result.region || '',
            id: result.id || '',
            durations: result.duration || 0,
            duration: (result.duration || 0) + ' Seconds',
            cover: fixUrl(result.cover),
            size_wm: result.wm_size || 0,
            size_nowm: result.size || 0,
            size_nowm_hd: result.hd_size || 0,
            data: data,
            music_info: {
                id: result.music_info?.id || '',
                title: result.music_info?.title || '',
                author: result.music_info?.author || '',
                album: result.music_info?.album || null,
                url: fixUrl(result.music || result.music_info?.play)
            },
            stats: {
                views: formatNumber(result.play_count),
                likes: formatNumber(result.digg_count),
                comment: formatNumber(result.comment_count),
                share: formatNumber(result.share_count),
                download: formatNumber(result.download_count)
            },
            author: {
                id: result.author?.id || '',
                fullname: result.author?.unique_id || '',
                nickname: result.author?.nickname || '',
                avatar: fixUrl(result.author?.avatar)
            }
        }
    } catch (e) {
        console.error('[TikTok] Error:', e.message)
        return { status: false, error: e.message }
    }
}

module.exports = tiktokDl
