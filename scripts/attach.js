let SHARE_SINGLE_DOWNLOAD_URL = null;
let MEDIA_SOURCE_BUFFER_TYPE = null;
let lyricsArray = null;
function fetchWithTimeout(url, timeout = 2000) {
    return new Promise((resolve, reject) => {
        // 设置超时定时器
        const timeoutId = setTimeout(() => {
            reject(new Error('Request timed out'));
        }, timeout);

        fetch(url)
            .then((response) => {
                clearTimeout(timeoutId);
                resolve(response);
            })
            .catch((err) => {
                clearTimeout(timeoutId);
                reject(err);
            });
    });
}

const mid =
    new URLSearchParams(window.location.hash.substring(1)).get('mid') ||
    new URLSearchParams(window.location.search).get('mid') ||
    '0';
let jsonURL = `${window.location.origin}/?api=playerInfoGet&mid=${mid}`;
// 判断window.location.origin是不是XX.github.io，是就相对路径，不是就绝对路径
if (window.location.origin.endsWith('.github.io')) {
    jsonURL = `${window.location.href
        .split('/')
        .slice(0, -1)
        .join('/')}/attach.json#mid=${mid}`;
} else {
    jsonURL = `${window.location.origin}/attach.json#mid=${mid}`;
}

fetchWithTimeout(jsonURL)
    .then((response) => {
        if (!response.ok) {
            //使用默认数据
            return {
                backgroundImage: './images/background.png',
                coverImage: './images/cover.jpg',
                songTitle: 'Unkown Song',
                artistName: 'Unkown Artist',
                musicURL: './resources/sound',
                mediaType: 'audio/mpeg',
                lrcFile: './resources/sound_lrc', //null,
                lrcExistLike: 'center', //中心center,隐藏hide,靠左left
                animationSTAN: 'circle', //圆周平移circle,无动画none,变长变短skew,左右倾斜stretch
            };
        }
        return response.json();
    })
    .then((data) => {
        // 进行DOM更新或其他操作
        document.getElementById('blur-background').style.cssText = `
        background: url('${data.backgroundImage}') no-repeat center center;
        background-size: cover;
      `;
        document.getElementById('cover-image').src = data.coverImage;
        document.getElementById('song-title').textContent = `${data.songTitle}`;
        document.getElementById(
            'artist-name'
        ).textContent = `${data.artistName}`;
        MEDIA_SOURCE_BUFFER_TYPE = data.mediaType;
        SHARE_SINGLE_DOWNLOAD_URL = data.musicURL;
        if (
            data.animationSTAN !== undefined &&
            data.animationSTAN !== null &&
            data.animationSTAN !== '' &&
            data.animationSTAN !== 'none'
        ) {
            switch (data.animationSTAN) {
                case 'circle': {
                    // 指定动画运行速度的范围
                    let a = 2; // 最小持续时间（秒）
                    let b = 5; // 最大持续时间（秒）
                    // 选择需要动画的元素
                    let elements = document.querySelectorAll('.song-info span');
                    elements.forEach(function (element) {
                        let text = element.textContent;
                        let newHTML = '';
                        // 拆分文本并为每个字符创建一个新的span
                        for (let i = 0; i < text.length; i++) {
                            newHTML +=
                                '<span class="char-animation-target">' +
                                text[i] +
                                '</span>';
                        }
                        // 更新HTML
                        element.innerHTML = newHTML;
                    });
                    // 获取所有新创建的字符元素
                    let chars = document.querySelectorAll(
                        '.char-animation-target'
                    );
                    chars.forEach(function (char) {
                        if (char.textContent.trim() !== '') {
                            // 忽略空白字符
                            // 为每个字符指定随机动画持续时间
                            let duration = Math.random() * (b - a) + a;
                            char.style.animationDuration = `${duration}s`;
                        }
                    });
                    break;
                }
                case 'skew': {
                    let elements = document.querySelectorAll('.song-info span');
                    elements.forEach(function (element) {
                        let text = element.textContent;
                        let newHTML = '';
                        for (let i = 0; i < text.length; i++) {
                            let charSpan =
                                '<span class="char-animation-target">' +
                                text[i] +
                                '</span>';
                            if (text[i].trim() !== '') {
                                // 如果字符不是空白
                                charSpan =
                                    '<span class="char-animation-target skew-animation">' +
                                    text[i] +
                                    '</span>';
                            }
                            newHTML += charSpan;
                        }
                        element.innerHTML = newHTML;
                    });
                    let chars = document.querySelectorAll(
                        '.char-animation-target'
                    );
                    break;
                }
                case 'stretch': {
                    let elements = document.querySelectorAll('.song-info span');
                    elements.forEach(function (element) {
                        let text = element.textContent;
                        let newHTML = '';
                        for (let i = 0; i < text.length; i++) {
                            let charSpan =
                                '<span class="char-animation-target">' +
                                text[i] +
                                '</span>';
                            if (text[i].trim() !== '') {
                                // 如果字符不是空白
                                charSpan =
                                    '<span class="char-animation-target stretch-animation">' +
                                    text[i] +
                                    '</span>';
                            }
                            newHTML += charSpan;
                        }
                        element.innerHTML = newHTML;
                    });
                    let chars = document.querySelectorAll(
                        '.char-animation-target'
                    );
                    chars.forEach(function (char) {
                        if (char.textContent.trim() !== '') {
                            let duration = Math.random() * (10 - 4) + 4; // 10到4秒之间的随机持续时间
                            char.style.animationDuration = `${duration}s`;
                        }
                    });
                    break;
                }
            }
        }
        //lrcFile
        if (
            data.lrcFile !== undefined &&
            data.lrcFile !== null &&
            data.lrcFile !== ''
        ) {
            fetchWithTimeout(data.lrcFile)
                .then((response) => {
                    if (!response.ok) {
                        return (LRC_TEXT = '[00:00.00]暂无歌词');
                    } else {
                        return response.text();
                    }
                })
                .then((LRC_TEXT) => {
                    LRC_TEXT = LRC_TEXT.trim();
                    const timeReg = /\[(\d{2}):(\d{2}\.\d{3})\]/;
                    const lines = LRC_TEXT.split(/\r\n|\n/); // 处理不同的换行符
                    lyricsArray = [];
                    lines.forEach((line) => {
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
                    document.getElementById('lyrics').textContent =
                        '点击播放即可使用lrc歌词数据';
                })
                .catch((error) => {});
        } else {
            // 解析LRC文本并创建数组
            lyricsArray = [{ time: 0, text: '暂无歌词' }];
            document.getElementById('lyrics').textContent =
                '点击播放即可使用lrc歌词数据';
        }
        if (
            data.lrcExistLike !== undefined &&
            data.lrcExistLike !== null &&
            data.lrcExistLike !== ''
        ) {
            // <div class="lyrics-container-container">
            const lyricsContainerContainer = document.querySelector(
                '.lyrics-container-container'
            );
            switch (data.lrcExistLike) {
                case 'center': {
                    if (
                        !lyricsContainerContainer.classList.contains(
                            'lyrics-container-container'
                        )
                    ) {
                        lyricsContainerContainer.classList.add(
                            'lyrics-container-container'
                        );
                    }
                    if (lyricsContainerContainer.style.cssText !== '') {
                        lyricsContainerContainer.style.cssText = '';
                    }
                    break;
                }
                case 'hide': {
                    lyricsContainerContainer.style.cssText = `
                    display: none;
                    `;
                    break;
                }
                case 'left': {
                    if (
                        lyricsContainerContainer.classList.contains(
                            'lyrics-container-container'
                        )
                    ) {
                        lyricsContainerContainer.classList.remove(
                            'lyrics-container-container'
                        );
                    }
                    if (lyricsContainerContainer.style.cssText !== '') {
                        lyricsContainerContainer.style.cssText = '';
                    }
                    break;
                }
            }
        }
    })
    .catch((error) => {});
