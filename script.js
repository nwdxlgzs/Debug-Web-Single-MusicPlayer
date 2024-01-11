var audioContext;
var analyser;
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
const mediaSource = new MediaSource();
const audio = document.createElement('audio');
audio.src = URL.createObjectURL(mediaSource);
mediaSource.addEventListener('sourceopen', sourceOpen);
audio.addEventListener('durationchange', () => {
    if (audio.duration !== Infinity) {
        audio.onloadedmetadata();
    }
});
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
        startVisualizer();
    } else {
        audio.pause();
        playPauseButton.style.backgroundImage = "url('./play_icon.svg')";
    }
});


const AUDIO_FFTSIZE = 2048;
function startVisualizer() {
    if (!audioContext) {
        // 创建新的AudioContext实例
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        var source = audioContext.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        analyser.fftSize = AUDIO_FFTSIZE;
        draw();
    } else if (audioContext.state === 'suspended') {
        // 仅在用户点击后恢复AudioContext
        audioContext.resume().then(() => {
            console.log("AudioContext resumed!");
        });
    }
}



function draw() {
    const bufferLength = analyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);
    const WIDTH = spectrumCanvas.width;
    const HEIGHT = spectrumCanvas.height;
    const centerX = WIDTH / 2;
    const centerY = HEIGHT / 2;
    const maxRadius = Math.min(WIDTH, HEIGHT) / 2;
    // const maxSampleSize = 180;
    // const Layers = Math.floor(AUDIO_FFTSIZE / maxSampleSize);
    const Layers = 3;
    const maxSampleSize = Math.floor(AUDIO_FFTSIZE / Layers);
    const canvasCtx = spectrumCanvas.getContext('2d');
    canvasCtx.imageSmoothingEnabled = true;
    const rgblayers = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
        // [255, 0, 0],
        // [255, 128, 0],
        // [255, 255, 0],
        // [0, 255, 0],
        // [0, 128, 255],
        // [0, 0, 255],
        // [128, 0, 255],
        // [255, 0, 255],
        // [255, 0, 128],
    ];
    function drawVisualizer() {
        requestAnimationFrame(drawVisualizer);
        analyser.getByteFrequencyData(dataArray);
        // 查找最大非零频域数据的索引
        var maxIndex = 0;
        for (var i = 0; i < bufferLength; i++) {
            if (dataArray[i] !== 0) {
                maxIndex = i;
            }
        }
        const MAX_DrawLayer = Math.floor(maxIndex / maxSampleSize);
        const RawBaseArrayAver = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
        function smoothData(dataArray, smoothingPasses, deeplayer) {
            const baseValue = dataArray.reduce((acc, val) => acc + val, 0) / (3 * dataArray.length) + RawBaseArrayAver;
            let adjustedData = dataArray.map(val => val + baseValue);
            let smoothedData = [...adjustedData];
            for (let pass = 0; pass < smoothingPasses; pass++) {
                let tempArray = [...smoothedData];
                for (let i = 0; i < dataArray.length; i++) {
                    let prevIndex = i > 0 ? i - 1 : dataArray.length - 1;
                    let nextIndex = i < dataArray.length - 1 ? i + 1 : 0;
                    smoothedData[i] = (tempArray[prevIndex] + tempArray[i] + tempArray[nextIndex]) / 3;
                }
            }
            smoothedData = smoothedData.map(val => val - 0);
            return smoothedData;
        }

        canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
        for (let lay_i = 0; lay_i < Layers; lay_i++) {
            if (lay_i > MAX_DrawLayer) {
                break;
            }
            var sampledDataArray = dataArray.slice(lay_i * maxSampleSize, (lay_i + 1) * maxSampleSize);
            // 在drawVisualizer函数中，在绘制前对sampledDataArray应用平滑函数
            sampledDataArray = smoothData(sampledDataArray, maxSampleSize / 1, lay_i);
            var prevX = centerX; // 初始化 prevX
            var prevY = centerY; // 初始化 prevY

            canvasCtx.beginPath();
            canvasCtx.moveTo(centerX, centerY);

            // 使用二次贝塞尔曲线平滑连接点
            for (var i = 0; i < maxSampleSize; i++) {
                var value = sampledDataArray[maxSampleSize - i - 1]; // 反向取样用于绘制左侧
                var percent = value / 255;
                var height = percent * maxRadius;
                var angle = Math.PI * 2 / maxSampleSize * i;
                angle = angle / 2 - Math.PI / 2;
                var x = centerX + height * Math.cos(angle);
                var y = centerY + height * Math.sin(angle);

                if (i === 0) {
                    canvasCtx.moveTo(x, y);
                } else {
                    var midpointX = (prevX + x) / 2;
                    var midpointY = (prevY + y) / 2;
                    canvasCtx.quadraticCurveTo(prevX, prevY, midpointX, midpointY);
                }

                prevX = x;
                prevY = y;
            }

            // 绘制右侧的对称部分
            for (var i = 0; i < maxSampleSize; i++) {
                var value = sampledDataArray[i]; // 正向取样用于绘制右侧
                var percent = value / 255;
                var height = percent * maxRadius;
                var angle = Math.PI * 2 / maxSampleSize * i;
                angle = angle / 2 + Math.PI / 2;
                var x = centerX + height * Math.cos(angle);
                var y = centerY + height * Math.sin(angle);
                if (i == maxSampleSize - 1) {
                    canvasCtx.moveTo(x, y);
                } else {
                    var midpointX = (prevX + x) / 2;
                    var midpointY = (prevY + y) / 2;
                    canvasCtx.quadraticCurveTo(prevX, prevY, midpointX, midpointY);
                }
                prevX = x;
                prevY = y;
            }

            canvasCtx.lineTo(centerX, centerY);
            canvasCtx.closePath();
            // canvasCtx.fillStyle = 'rgba(0, 255, 255, 1)';
            const coloi = lay_i % rgblayers.length;
            canvasCtx.fillStyle = `rgba(${rgblayers[coloi][0]}, ${rgblayers[coloi][1]}, ${rgblayers[coloi][2]}, ${(Layers - coloi) / Layers})`;
            canvasCtx.fill();
        }
    }

    drawVisualizer();
}

// // 此函数用来模拟一个简单的频谱效果，实际项目中可以使用Web Audio API进行更精确的频率分析
// function drawSpectrumMock() {
//     {
//         const ctx = spectrumCanvas.getContext('2d');
//         const width = spectrumCanvas.width;
//         const height = spectrumCanvas.height;
//         ctx.clearRect(0, 0, width, height);
//         ctx.fillStyle = 'rgba(0, 128, 255, 0.7)';
//         // 随机生成柱状图
//         for (let i = 0; i < width / 10; i++) {
//             const barHeight = Math.random() * height / 2;
//             ctx.fillRect(i * 10, height - barHeight, 5, barHeight);
//         }
//     }
//     {
//         const ctx = bottomSpectrumCanvas.getContext('2d');
//         const width = bottomSpectrumCanvas.width;
//         const height = bottomSpectrumCanvas.height;
//         ctx.clearRect(0, 0, width, height);
//         ctx.fillStyle = 'rgba(0, 128, 255, 0.7)';
//         // 随机生成柱状图
//         for (let i = 0; i < width / 10; i++) {
//             const barHeight = Math.random() * height / 2;
//             ctx.fillRect(i * 10, height - barHeight, 5, barHeight);
//         }
//     }
//     requestAnimationFrame(drawSpectrumMock);
// }

// // 调用函数来模拟频谱效果
// drawSpectrumMock();



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



async function sourceOpen() {
    try {
        // 获取音乐文件的响应流
        const response = await fetch('sound');
        const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg'); // 音频格式需要与文件类型匹配

        const reader = response.body.getReader();
        const pump = async () => {
            const { done, value } = await reader.read();
            if (done) {
                mediaSource.endOfStream();
                // audio.play(); // 当音频数据加载完毕后播放
                return;
            }
            sourceBuffer.appendBuffer(value); // 将数据块添加到sourceBuffer
            await new Promise(resolve => sourceBuffer.onupdateend = resolve);
            pump();
        };

        pump();
    } catch (e) {
        console.error('Error fetching audio', e);
        alert("Error on get sound file.");
    }
}

