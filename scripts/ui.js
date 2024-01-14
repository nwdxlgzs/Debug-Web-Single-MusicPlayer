import { formatTime } from './utils.js';

const playPauseButton = document.getElementById('playPause');
const songProgress = document.getElementById('song-progress');
const timeElapsed = document.getElementById('time-elapsed');
const totalDuration = document.getElementById('total-duration');
const volumeBtn = document.getElementById('volume-btn');
const volumeControl = document.getElementById('volume-control');
const lyricsElement = document.getElementById('lyrics');

/**
 * 
 * @param {number} progress 
 * @param {number | null} currentTime 
 */
var lastLyricIndex = -1;
export async function changeProgress(progress, currentTime) {
    songProgress.value = progress;
    if (currentTime) {
        const { lyricsArray } = await import('./attach.js');
        if (lyricsArray !== undefined) {
            timeElapsed.textContent = formatTime(currentTime);
            let currentLyricIndex = 0;
            for (let [i, lyric] of lyricsArray.entries()) {
                if (currentTime >= lyric.time) {
                    currentLyricIndex = i;
                } else {
                    break
                }
            }
            if (currentLyricIndex !== lastLyricIndex) {
                const text = lyricsArray[currentLyricIndex].text;
                lyricsElement.classList.remove('lyrics-active');
                // lyricsElement.textContent = lyricsArray[currentLyricIndex].text;
                setTimeout(() => {
                    lyricsElement.textContent = text;
                    lyricsElement.classList.add('lyrics-active');
                    lastLyricIndex = currentLyricIndex;
                }, 100);
                return;
            }
        }
    }
}

/**
 * 
 * @param {boolean} status 
 */
export function changePlayButtonStatus(status) {
    if (!status) {
        playPauseButton.style.backgroundImage = "url('./images/play_icon.svg')";
    } else {
        playPauseButton.style.backgroundImage =
            "url('./images/pause_icon.svg')";
    }
}

/**
 *
 * @param {()=>void} func
 */
export function listenPlayButtonClick(func) {
    playPauseButton.addEventListener('click', function () {
        func();
    });
}

/**
 *
 * @param {number} duration
 */
export function setTotalDuration(duration) {
    totalDuration.textContent = formatTime(duration);
}

/**
 *
 * @param {(progress: number) => void} func
 */
export function listenProgressChange(func) {
    songProgress.addEventListener('input', function () {
        func(this.value);
    });
}

/**
 *
 * @param {(progress: number) => void} func
 */
export function listenVolumeChange(func) {
    volumeControl.addEventListener('input', function () {
        func(this.value);
    });
}

/**
 * 
 * @param {import('./attach.js').AttachConfig} data 
 */
function changeSongTitle(data) {
    document.getElementById('song-title').textContent = `${data.songTitle}`;
    if (typeof data.animationSTAN !== 'string' || data.animationSTAN === "" || data.animationSTAN !== "none") {
        return
    }
    // 选择需要动画的元素
    // #region 标题动画
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
    }
    // #endregion 标题动画
}

/**
 * 
 * @param {string} lrcExistLike 
 */
function changeLyricsStyle(lrcExistLike) {
    // <div class="lyrics-container-container">
    const lyricsContainerContainer = document.querySelector('.lyrics-container-container');
    switch (lrcExistLike) {
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

// 音量按钮点击事件处理函数
volumeBtn.addEventListener('click', function () {
    // 切换音量滑动条的显示和隐藏
    if (
        volumeControl.style.display === 'none' ||
        volumeControl.style.display === ''
    ) {
        volumeControl.style.display = 'block';
    } else {
        volumeControl.style.display = 'none';
    }
});

// 添加点击外部隐藏音量控制的事件监听
document.addEventListener('click', function (event) {
    const isClickInsideVolumeContainer =
        volumeBtn.contains(event.target) ||
        volumeControl.contains(event.target);

    if (!isClickInsideVolumeContainer) {
        // 如果点击的是音量按钮或滑动条之外的地方，则隐藏音量滑动条
        volumeControl.style.display = 'none';
    }
});


import('./attach.js').then(({ data, ensureLyricsArray }) => {

    // 进行DOM更新或其他操作
    document.getElementById('blur-background').style.backgroundImage = `url('${data.backgroundImage}')`;
    document.getElementById('cover-image').src = data.coverImage;
    document.getElementById('artist-name').textContent = `${data.artistName}`;
    changeSongTitle(data);

    const lyricsParagraph = document.getElementById('lyrics')
    if (data.lrcExistLike !== 'hide') {
        // 都不显示歌词了还要歌词有什么用
        ensureLyricsArray().then(() => {
            lyricsParagraph.textContent = "点击播放即可使用lrc歌词数据";
        })
    }

    if (typeof data.lrcExistLike === 'string' && data.lrcExistLike) {
        changeLyricsStyle(data.lrcExistLike)
    }
})
