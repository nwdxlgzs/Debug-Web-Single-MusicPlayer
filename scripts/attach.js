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
 * @property {string|null} lrcFile
 * @property {string} lrcExistLike 中心`center`,隐藏`hide`,靠左`left`
 * @property {string} animationSTAN 圆周平移`circle`,无动画`none`,变长变短`skew`,左右倾斜`stretch`
 */

/**
 * @type {{ time:number, text:string }[] | null}
 */
export let lyricsArray = undefined

/** @type {(AttachConfig )?} */
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

// 进行DOM更新或其他操作
document.getElementById('blur-background').style.backgroundImage = `url('${data.backgroundImage}')`;
document.getElementById('cover-image').src = data.coverImage;
document.getElementById('song-title').textContent = `${data.songTitle}`;
document.getElementById('artist-name').textContent = `${data.artistName}`;

// #region 标题动画
if (typeof data.animationSTAN === 'string' && data.animationSTAN !== "" && data.animationSTAN !== "none") {
    // 选择需要动画的元素
    let elements = document.querySelectorAll('.song-info span');
    switch (data.animationSTAN) {
        case "circle": {
            // 指定动画运行速度的范围
            let a = 2; // 最小持续时间（秒）
            let b = 5; // 最大持续时间（秒）
            elements.forEach(function (element) {
                let newHTML = '';
                // 拆分文本并为每个字符创建一个新的span
                for (let character of element.textContent) {
                    if (character.trim() !== '') {
                        newHTML += `<span class="char-animation-target">${character}</span>`;
                    } else {
                        newHTML += character
                    }
                }
                // 更新HTML
                element.innerHTML = newHTML;
            });
            // 获取所有新创建的字符元素
            let chars = document.querySelectorAll('.char-animation-target');
            chars.forEach(function (char) {
                if (char.textContent.trim() !== '') { // 忽略空白字符
                    // 为每个字符指定随机动画持续时间
                    var duration = Math.random() * (b - a) + a;
                    char.style.animationDuration = `${duration}s`;
                }
            });
            break
        }
        case "skew": {
            elements.forEach(function (element) {
                let newHTML = '';
                for (let character of element.textContent) {
                    if (character.trim() !== '') {
                        newHTML += `<span class="char-animation-target skew-animation">${character}</span>`;
                    } else {
                        newHTML += character
                    }
                }
                element.innerHTML = newHTML;
            });
            break
        }
        case "stretch": {
            elements.forEach(function (element) {
                var newHTML = '';
                for (let character of element.textContent) {
                    if (character.trim() !== '') {
                        newHTML += `<span class="char-animation-target stretch-animation">${character}</span>`;
                    } else {
                        newHTML += character
                    }
                }
                element.innerHTML = newHTML;
            });
            let chars = document.querySelectorAll('.char-animation-target');
            chars.forEach(function (char) {
                if (char.textContent.trim() !== '') {
                    let duration = Math.random() * (10 - 4) + 4; // 10到4秒之间的随机持续时间
                    char.style.animationDuration = `${duration}s`;
                }
            });
            break
        }
    };
}
// #endregion 标题动画

/**
 * 异步获取歌词数组
 *
 * 如果先前未获取歌词，则获取歌词后返回
 */
export async function ensureLyricsArray() {
    if (lyricsArray !== undefined) {
        return lyricsArray
    }
    const lyricsParagraph = document.getElementById('lyrics')
    if (typeof data.lrcFile === 'string' && data.lrcFile !== '') {
        const response = await fetchWithTimeout(data.lrcFile)
        const lrcText = (response.ok ? await response.text() : "[00:00.00]暂无歌词").trim();
        const timeReg = /\[(\d{2}):(\d{2}\.\d{3})\]/;
        const lines = lrcText.split(/\r\n|\n/); // 处理不同的换行符
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
        lyricsParagraph.textContent = "点击播放即可使用lrc歌词数据";
        // TODO: 移动到 ui.js 或 main.js 中
        /* lyricsArray = [{ time: 0, text: String(error) }];
        lyricsParagraph.textContent = String(error); */
    } else {
        // 解析LRC文本并创建数组
        lyricsArray = [{ time: 0, text: "暂无歌词" }];
        lyricsParagraph.textContent = "点击播放即可使用lrc歌词数据";
    }
    return lyricsArray
}

// #region 歌词对其或隐藏
if (typeof data.lrcExistLike === 'string' && data.lrcExistLike !== "") {
    // <div class="lyrics-container-container">
    const lyricsContainerContainer = document.querySelector('.lyrics-container-container');
    switch (data.lrcExistLike) {
        case "center": {
            if (!lyricsContainerContainer.classList.contains('lyrics-container-container')) {
                lyricsContainerContainer.classList.add('lyrics-container-container');
            }
            lyricsContainerContainer.style.display = undefined;
            break
        }
        case "hide": {
            lyricsContainerContainer.style.display = "none";
            break
        }
        case "left": {
            if (lyricsContainerContainer.classList.contains('lyrics-container-container')) {
                lyricsContainerContainer.classList.remove('lyrics-container-container');
            }
            lyricsContainerContainer.style.display = undefined;
            break
        }
    };
}
// #endregion 歌词对其或隐藏
