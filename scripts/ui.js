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
export function changeProgress(progress, currentTime) {
    songProgress.value = progress;
    if (currentTime) {
        timeElapsed.textContent = formatTime(currentTime);
        let currentLyricIndex=0;
        for (let i = 0; i < lyricsArray.length; i++) {
            if (currentTime >= lyricsArray[i].time) {
                currentLyricIndex = i;
            }
        }
        // 更新元素的文本
        lyricsElement.textContent = lyricsArray[currentLyricIndex].text;
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

// 空格键控制播放暂停
document.addEventListener('keydown', function (event) {
    if (event.code === 'Space') {
        playPauseButton.click();
    }
});