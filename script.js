// 定义全局变量
const playPauseButton = document.getElementById('playPause');
const songProgress = document.getElementById('song-progress');
const timeElapsed = document.getElementById('time-elapsed');
const totalDuration = document.getElementById('total-duration');
const spectrumCanvas = document.getElementById('spectrum-canvas');
const bottomSpectrumCanvas = document.getElementById('bottom-spectrum-canvas');
const volumeBtn = document.getElementById('volume-btn');
const volumeControl = document.getElementById('volume-control');
// 创建Audio对象
const audio = new Audio();
audio.src = './sound.mp3'; // 您的音频文件路径

audio.onloadedmetadata = function () {
    totalDuration.textContent = formatTime(audio.duration);
};

audio.addEventListener('timeupdate', function () {
    var progress = (audio.currentTime / audio.duration) * 100;
    songProgress.value = progress;
    timeElapsed.textContent = formatTime(audio.currentTime);
});
audio.addEventListener('ended', function () {
    songProgress.value = 0;
    playPauseButton.style.backgroundImage = "url('./play_icon.svg')";
});


// 格式化时间
function formatTime(time) {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;
    return `${minutes}:${formattedSeconds}`;
}

// 播放暂停按钮功能
playPauseButton.addEventListener('click', function () {
    if (audio.paused) {
        audio.play();
        playPauseButton.style.backgroundImage = "url('./pause_icon.svg')";
    } else {
        audio.pause();
        playPauseButton.style.backgroundImage = "url('./play_icon.svg')";
    }
});




// 此函数用来模拟一个简单的频谱效果，实际项目中可以使用Web Audio API进行更精确的频率分析
function drawSpectrumMock() {
    {
        const ctx = spectrumCanvas.getContext('2d');
        const width = spectrumCanvas.width;
        const height = spectrumCanvas.height;
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = 'rgba(0, 128, 255, 0.7)';
        // 随机生成柱状图
        for (let i = 0; i < width / 10; i++) {
            const barHeight = Math.random() * height / 2;
            ctx.fillRect(i * 10, height - barHeight, 5, barHeight);
        }
    }
    {
        const ctx = bottomSpectrumCanvas.getContext('2d');
        const width = bottomSpectrumCanvas.width;
        const height = bottomSpectrumCanvas.height;
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = 'rgba(0, 128, 255, 0.7)';
        // 随机生成柱状图
        for (let i = 0; i < width / 10; i++) {
            const barHeight = Math.random() * height / 2;
            ctx.fillRect(i * 10, height - barHeight, 5, barHeight);
        }
    }
    requestAnimationFrame(drawSpectrumMock);
}

// 调用函数来模拟频谱效果
drawSpectrumMock();



// 进度控制事件
songProgress.addEventListener('input', function () {
    var seekTime = audio.duration * (this.value / 100);
    audio.currentTime = seekTime;
});
// 音量按钮点击事件处理函数
volumeBtn.addEventListener('click', function () {
    // 切换音量滑动条的显示和隐藏
    if (volumeControl.style.display === 'none' || volumeControl.style.display === '') {
        volumeControl.style.display = 'block';
    } else {
        volumeControl.style.display = 'none';
    }
});

// 音量滑动条输入事件处理函数
volumeControl.addEventListener('input', function () {
    // 设置音频播放器的音量
    // 音量滑动条的范围是 0 到 100，音频元素的音量属性的范围是 0.0 到 1.0
    audio.volume = volumeControl.value / 100;
});

// 添加点击外部隐藏音量控制的事件监听
document.addEventListener('click', function (event) {
    var isClickInsideVolumeContainer = volumeBtn.contains(event.target) || volumeControl.contains(event.target);

    if (!isClickInsideVolumeContainer) {
        // 如果点击的是音量按钮或滑动条之外的地方，则隐藏音量滑动条
        volumeControl.style.display = 'none';
    }
});
