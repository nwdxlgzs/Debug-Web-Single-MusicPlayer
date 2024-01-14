/**
 * 
 * @param {RequestInfo | URL} url
 * @param {number} timeout
 * @template T
 * @returns {Promise<T>}
 */
async function fetchWithTimeout(url, timeout = 2000) {
    return new Promise((resolve, reject) => {
        // 设置超时定时器
        const timeoutId = setTimeout(() => {
            reject(new Error('Request timed out'));
        }, timeout);

        fetch(url)
            .then(response => {
                clearTimeout(timeoutId);
                resolve(response);
            })
            .catch(err => {
                clearTimeout(timeoutId);
                reject(err);
            });
    });
}

const mid = (new URLSearchParams(window.location.hash.substring(1))).get('mid') || (new URLSearchParams(window.location.search)).get('mid') || '0';
let jsonURL = `${window.location.origin}/?api=playerInfoGet&mid=${mid}`;
// 判断window.location.origin是不是XX.github.io，是就相对路径，不是就绝对路径
if (window.location.origin.endsWith('.github.io')) {
    jsonURL = `${window.location.href.split('/').slice(0, -1).join('/')}/attach.json#mid=${mid}`;
} else {
    jsonURL = `${window.location.origin}/attach.json#mid=${mid}`;
}

/**
 * @typedef {Object} AttachConfig
 * @property {string} backgroundImage
 * @property {string} coverImage
 * @property {string} songTitle
 * @property {string} artistName
 * @property {string} musicURL
 * @property {string} mediaType
 * @property {?string} lrcFile
 * @property {'center'|'hide'|'left'|string} lrcExistLike 中心`center`,隐藏`hide`,靠左`left`
 * @property {string} animationSTAN 圆周平移`circle`,无动画`none`,变长变短`skew`,左右倾斜`stretch`
 */

/**
 * @typedef {Object} LyricLine
 * @property {number} time
 * @property {string} text
 */

/**
 * @type {?LyricLine[]}
 */
export let lyricsArray = undefined

/** @type {?AttachConfig } */
export let data = undefined


const response = await fetchWithTimeout(jsonURL)
data = response.ok ? await response.json() : {//使用默认数据
    backgroundImage: './images/background.png',
    coverImage: './images/cover.jpg',
    songTitle: 'Unknown Song',
    artistName: 'Unknown Artist',
    musicURL: './resources/sound',
    mediaType: "audio/mpeg",
    lrcFile: "./resources/sound_lrc",//null,
    lrcExistLike: "center",//中心center,隐藏hide,靠左left
    animationSTAN: "circle"//圆周平移circle,无动画none,变长变短skew,左右倾斜stretch
};



/**
 * 异步获取歌词数组
 *
 * 如果先前未获取歌词，则获取歌词后返回
 */
export async function ensureLyricsArray() {
    if (lyricsArray !== undefined) {
        return lyricsArray
    }

    if (typeof data.lrcFile === 'string' && data.lrcFile !== '') {
        const response = await fetchWithTimeout(data.lrcFile)
        const lrcText = (response.ok ? await response.text() : "[00:00.00]暂无歌词").trim();
        const timeReg = /\[(\d{2}):(\d{2}\.\d{3})\]/;
        const lines = lrcText.split(/\r\n|\n/); // 处理不同的换行符
        try {
            lyricsArray = [];
            lines.forEach(line => {
                const match = timeReg.exec(line);
                if (match) {
                    // 将时间转换为秒
                    const minutes = parseInt(match[1]);
                    const seconds = parseFloat(match[2]);
                    const time = minutes * 60 + seconds;
                    // 提取歌词部分
                    const text = line.replace(timeReg, '').trim();
                    // 添加到结果数组
                    lyricsArray.push({ time, text });
                }
            });
            // 按时间排序
            lyricsArray.sort((a, b) => {
                return a.time - b.time;
            });
        } catch (err) {
            lyricsArray = [{ time: 0, text: String(err) }];
        }
    } else {
        // 解析LRC文本并创建数组
        lyricsArray = [{ time: 0, text: "暂无歌词" }];
    }
    return lyricsArray
}

