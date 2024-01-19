window.attach = {}; //window全局变量
// window.attach.decrypt = async function (buff) {
//     // 使用Xor算法解密
//     const key = 0x6a;
//     for (let i = 0; i < buff.length; i++) {
//         buff[i] = buff[i] ^ key;
//     }
//     return buff;
// };
// ============对window.attach.decrypt进行保护============
// 原始解密函数的引用
let originalDecrypt = null;
// 检查函数是否被修改的函数
function isFunctionTampered(fnOriginal, fnCurrent) {
    return fnOriginal.toString() !== fnCurrent.toString();
}
// 使用Object.defineProperty冻结window.attach.decrypt
Object.defineProperty(window.attach, 'decrypt', {
    value: async function (buff) {
        if (isFunctionTampered(originalDecrypt, window.attach.decrypt)) {
            return;
        }
        const key = 0x6a;
        for (let i = 0; i < buff.length; i++) {
            buff[i] = buff[i] ^ key;
        }
        return buff;
    },
    writable: false, // 标记为不可写
    configurable: false // 标记为不可重新配置
});
originalDecrypt = window.attach.decrypt;
// ============对window.attach.decrypt进行保护============
window.attach.MainColorForCover = [255, 255, 255];
window.attach.DEFAULT_JSON = {
    backgroundImage: './images/background.png',
    coverImage: './images/cover.png',
    songTitle: 'Unkown Song',
    artistName: 'Unkown Artist',
    musicURL: './resources/sound',//播放合成语音：媒体地址不存在
    mediaType: 'audio/mpeg',
    backgroundType: 'gradient',//blur使BGfilterBlurPx有效|gradient使BGGradientConfig有效
    BGfilterBlurPx: 5,//像素大小
    lrcFile: null,//null时无文件
    lrcExistLike: 'hide',//hide隐藏并且一并隐藏歌词按钮哪怕lrcFile有效，left靠左，center居中
    animationSTAN: 'circle',//circle圆周平移，stretch左右倾斜，skew变长变短，none无动画
    BGGradientConfig: {
        colorSource: "cover",
        // cover使用封面，另一种直接设置颜色的方案，设置后coverThemeIndex无效
        // colorSource: [
        //     "rgba(0,0,0,0.1)",
        //     "rgba(0,0,0, 0.3)"
        // ],
        alphas: [
            0.1,
            0.5
        ],
        ranges: [
            25,
            80
        ],
        coverThemeIndex: 0
    },
    like: true,//是否默认勾选喜欢
    BGMusicScale: 0,//背景和音频缩放参数，0为不缩放，推荐0.05
    waveLike: 'line|circle',//(line|mirror-line)|circle
    coverScale: true,
    coverRotate: true,
    withBubbles: true,
    waveCircleConfig: {
        lineColors: ['#90E3F5', '#5C8AF4', '#BEABF0', '#E1A2E1'],//lineColors影响圈数
        fillColor: 'cover',//cover从封面取，否则用这里的值，形如[255,255,255]
        fillAlphaDeep: 0.8,//每层均分这里的透明度
        coverThemeIndex: 0,//color为cover时有效
    },
    waveLineConfig: {
        barWidth: 4,
        gapWidth: 3,
        flip: false,
        color: "cover",//rainbow彩色，cover从封面取，否则用这里的值，形如rgb(0,0,0)
        coverThemeIndex: 1,//color为cover时有效
    },
    bubblesColor: 'white',
};


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
function escapeHtmlStr(unsafe) {
    //转义html字符包括空格
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\s/g, '&nbsp;');
}

const mid =
    new URLSearchParams(window.location.hash.substring(1)).get('mid') ||
    new URLSearchParams(window.location.search).get('mid') ||
    '0';
const diff_demo =
    new URLSearchParams(window.location.hash.substring(1)).get('diff_demo') ||
    new URLSearchParams(window.location.search).get('diff_demo') ||
    'null';
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

function fillDefault(data, key, default_data) {
    if (!data.hasOwnProperty(key) || data[key] === undefined || data[key] === null) {
        data[key] = default_data[key];
    }
}

fetchWithTimeout(jsonURL)
    .then((response) => {
        if (!response.ok) {
            //使用默认数据
            return window.attach.DEFAULT_JSON;
        }
        return response.json();
    })
    .then((data) => {
        //通过diff_demo切换不同的演示歌曲，这里做一次适配
        if (
            data['replace-attach-content-demo'] != undefined &&
            data['replace-attach-content-demo'] != null &&
            diff_demo !== null &&
            diff_demo !== 'null' &&
            diff_demo !== '' &&
            diff_demo !== undefined
        ) {
            //Heartbeat|EmptyLove|IReallyLikeYou|提拉米苏
            switch (diff_demo) {
                case 'Heartbeat': {
                    data = data['replace-attach-content-demo'][0];
                    break;
                }
                case 'EmptyLove': {
                    data = data['replace-attach-content-demo'][1];
                    break;
                }
                case 'IReallyLikeYou': {
                    data = data['replace-attach-content-demo'][2];
                    break;
                }
                case '提拉米苏': {
                    data = data['replace-attach-content-demo'][3];
                    break;
                }
            }
        }
        //修正补全缺省的值
        const default_data = window.attach.DEFAULT_JSON;
        const default_dataBGGradientConfig = default_data.BGGradientConfig;
        const default_datawaveCircleConfig = default_data.waveCircleConfig;
        const default_datawaveLineConfig = default_data.waveLineConfig;
        fillDefault(data, 'backgroundImage', default_data);
        fillDefault(data, 'coverImage', default_data);
        fillDefault(data, 'backgroundType', default_data);
        fillDefault(data, 'BGGradientConfig', default_data);
        fillDefault(data, 'waveCircleConfig', default_data);
        fillDefault(data, 'waveLineConfig', default_data);
        fillDefault(data, 'songTitle', default_data);
        fillDefault(data, 'artistName', default_data);
        if (data.lrcFile == undefined || data.lrcFile == null) {
            fillDefault(data, 'lrcExistLike', default_data);
        } else {
            fillDefault(data, 'lrcExistLike', { lrcExistLike: 'left' });
        }
        fillDefault(data, 'mediaType', default_data);
        fillDefault(data, 'animationSTAN', default_data);
        fillDefault(data, 'waveLike', default_data);
        fillDefault(data, 'coverScale', default_data);
        fillDefault(data, 'coverRotate', default_data);
        fillDefault(data, 'withBubbles', default_data);
        fillDefault(data, 'bubblesColor', default_data);
        fillDefault(data, 'BGfilterBlurPx', default_data);
        fillDefault(data, 'like', default_data);
        fillDefault(data, 'BGMusicScale', default_data);
        const BGGradientConfig = data.BGGradientConfig;
        fillDefault(BGGradientConfig, 'alphas', default_dataBGGradientConfig);
        fillDefault(BGGradientConfig, 'ranges', default_dataBGGradientConfig);
        fillDefault(BGGradientConfig, 'colorSource', default_dataBGGradientConfig);
        fillDefault(BGGradientConfig, 'coverThemeIndex', default_dataBGGradientConfig);
        const waveCircleConfig = data.waveCircleConfig;
        fillDefault(waveCircleConfig, 'lineColors', default_datawaveCircleConfig);
        fillDefault(waveCircleConfig, 'fillColor', default_datawaveCircleConfig);
        fillDefault(waveCircleConfig, 'fillAlphaDeep', default_datawaveCircleConfig);
        fillDefault(waveCircleConfig, 'coverThemeIndex', default_datawaveCircleConfig);
        const waveLineConfig = data.waveLineConfig;
        fillDefault(waveLineConfig, 'barWidth', default_datawaveLineConfig);
        fillDefault(waveLineConfig, 'gapWidth', default_datawaveLineConfig);
        fillDefault(waveLineConfig, 'flip', default_datawaveLineConfig);
        fillDefault(waveLineConfig, 'color', default_datawaveLineConfig);
        fillDefault(waveLineConfig, 'coverThemeIndex', default_datawaveLineConfig);
        return data;
    }).then(
        (data) => {
            /**
             *
             * @param {AttachData<BackgroundType>} data
             */
            // recvData接收选中的json
            window.attach.recvData = data;
            window.attach.MEDIA_SOURCE_BUFFER_TYPE = data.mediaType;
            window.attach.SHARE_SINGLE_DOWNLOAD_URL = data.musicURL;
            window.attach.COVER_IMAGE_URL = data.coverImage;
            window.attach.BACKGROUND_IMAGE_URL = data.backgroundImage;
            window.attach.WAVE_LINELIKE = null;
            if (data.waveLike.includes('mirror-line')) {
                window.attach.WAVE_LINELIKE = 'mirror-line';
            } else if (data.waveLike.includes('line')) {
                window.attach.WAVE_LINELIKE = 'line';
            }
            window.attach.WAVE_CRICLE = data.waveLike.includes('circle') ? 'show' : 'hide';
            window.attach.COVER_SCALE = data.coverScale;
            window.attach.COVER_ROTATE = data.coverRotate;
            window.attach.WITH_BUBBLES = data.withBubbles;
            if (Array.isArray(data.waveCircleConfig.fillColor)) {
                window.attach.MainColorForCover = data.waveCircleConfig.fillColor;
            }
            // 更新网页属性

            document.getElementById('song-title').textContent = `${data.songTitle}`;
            document.getElementById('artist-name').textContent = `${data.artistName}`;

            const likeThisButton = document.getElementById('like-this');
            if (data.like && !likeThisButton.classList.contains("like-this-btn-active")) {
                likeThisButton.classList.add('like-this-btn-active');
            }

            const blurBackground = document.getElementById('blur-background');
            // 背景类型
            if (data.backgroundType === 'blur') {
                blurBackground.style.cssText = `
            background: url('${window.attach.BACKGROUND_IMAGE_URL}') no-repeat center center;
            background-size: cover;
            filter: blur(${data.BGfilterBlurPx}px);
          `;
            } else if (data.backgroundType === 'gradient') {
                blurBackground.style.cssText = `
                background: url('${window.attach.BACKGROUND_IMAGE_URL}') no-repeat center center;
                background-size: cover;
              `;

                // 如果为自定义颜色
                if (Array.isArray(data.BGGradientConfig["colorSource"])) {
                    // 在未确定修改之前不要更换 class
                    blurBackground.classList.remove('blur-background');
                    blurBackground.classList.add('gradient-background');

                    // 设置为自定义 css 变量
                    blurBackground.style.setProperty(
                        '--start-gradient-color',
                        `${data.BGGradientConfig.colorSource[0]} ${data.BGGradientConfig.ranges[0]}% `
                    );

                    blurBackground.style.setProperty(
                        '--end-gradient-color',
                        `${data.BGGradientConfig.colorSource[1]} ${data.BGGradientConfig.ranges[1]}% `
                    );
                }
            }

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
                        let elements =
                            document.querySelectorAll('.song-info span');
                        elements.forEach(function (element) {
                            let text = element.textContent;
                            let newHTML = '';
                            const characters = Array.from(text);
                            for (let character of characters) {
                                character = escapeHtmlStr(character);
                                newHTML +=
                                    '<span class="char-animation-target">' +
                                    character +
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
                        let elements =
                            document.querySelectorAll('.song-info span');
                        elements.forEach(function (element) {
                            let text = element.textContent;
                            let newHTML = '';
                            const characters = Array.from(text);
                            for (let character of characters) {
                                character = escapeHtmlStr(character);
                                if (character.trim() === '') {
                                    newHTML +=
                                        '<span class="char-animation-target">' +
                                        character +
                                        '</span>';
                                } else {
                                    newHTML +=
                                        '<span class="char-animation-target skew-animation">' +
                                        character +
                                        '</span>';
                                }
                            }
                            element.innerHTML = newHTML;
                        });
                        break;
                    }
                    case 'stretch': {
                        let elements =
                            document.querySelectorAll('.song-info span');
                        elements.forEach(function (element) {
                            let text = element.textContent;
                            let newHTML = '';
                            const characters = Array.from(text);
                            for (let character of characters) {
                                character = escapeHtmlStr(character);
                                if (character.trim() === '') {
                                    newHTML +=
                                        '<span class="char-animation-target">' +
                                        character +
                                        '</span>';
                                } else {
                                    newHTML +=
                                        '<span class="char-animation-target stretch-animation">' +
                                        character +
                                        '</span>';
                                }
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
                        const timeReg = /\[(\d+):(\d+\.\d+)\]/;
                        const lines = LRC_TEXT.split(/\r\n|\n/); // 处理不同的换行符
                        window.attach.lyricsArray = [];
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
                                window.attach.lyricsArray.push({ time, text });
                            }
                        });
                        // 按时间排序
                        window.attach.lyricsArray.sort((a, b) => {
                            return a.time - b.time;
                        });
                        document.getElementById('lyrics').textContent =
                            '点击播放即可使用lrc歌词数据';
                    })
                    .catch((error) => { });
            } else {
                // 解析LRC文本并创建数组
                window.attach.lyricsArray = [{ time: 0, text: '暂无歌词' }];
                document.getElementById('lyrics').textContent =
                    '点击播放即可使用lrc歌词数据';
            }
            if (
                data.lrcExistLike !== undefined &&
                data.lrcExistLike !== null &&
                data.lrcExistLike !== ''
            ) {
                const lyricsContainerContainer = document.getElementById(
                    'lyrics-container-container'
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
                        const lyricsShowBtn =
                            document.getElementById('lyrics-show');
                        lyricsShowBtn.classList.remove('with-line');
                        lyricsShowBtn.style.display = 'none';
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
        }
    )
    .catch((error) => { });

/**
 * @typedef {'blur' | 'gradient'} BackgroundType
 */

/**
 * @template {T extends BackgroundType} T
 * 
 * @typedef {{
 *  backgroundImage?: string;
*   coverImage?: string;
*   songTitle?: string;
*   artistName?: string;
*   musicURL?: string;
*   mediaType?: string;
*   backgroundType: T;
*   lrcFile?: string;
*   lrcExistLike?: 'hide' | 'center' | 'left';
*   animationSTAN?: 'circle' | 'none' | 'skew' | 'stretch';
*   BGfilterBlurPx?: number;
*   BGGradientConfig: T extends 'gradient' ? BackgroundGradientData undefined; 
* }} AttachData

 */
