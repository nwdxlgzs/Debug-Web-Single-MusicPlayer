import { formatTime } from './utils.js';
import { draw } from './draw.js';
import AudioPlayer from './audioPlayer.js';
import * as ui from './ui.js';

// 定义全局变量
const spectrumCanvas = document.getElementById('spectrum-canvas');
const coverImage = document.getElementById('cover-image');
const coverImageContainer = document.getElementById('cover-container');
const topSpectrumCanvas = document.getElementById('top-spectrum-canvas');
const bottomSpectrumCanvas = document.getElementById('bottom-spectrum-canvas');

const player = new AudioPlayer();

async function initAudioPlayer() {
    // create player
    player.create();

    const audio = player.audio;

    audio.onloadedmetadata = function () {
        ui.setTotalDuration(audio.duration);
    };

    audio.addEventListener('timeupdate', function () {
        const progress = (audio.currentTime / audio.duration) * 100;
        ui.changeProgress(progress, audio.currentTime);
    });
    audio.addEventListener('ended', function () {
        ui.changeProgress(0, null);
        ui.changePlayButtonStatus(false);
    });

    // 格式化时间
}

function startVisualizer() {
    const audioContext = player.audioContext;

    draw(player.analyser, spectrumCanvas, coverImage, coverImageContainer, topSpectrumCanvas, bottomSpectrumCanvas);

    if (audioContext.state === 'suspended') {
        // 仅在用户点击后恢复AudioContext
        audioContext.resume().then(() => {
            console.log('AudioContext resumed!');
        });
    }
}


// 播放暂停按钮功能
ui.listenPlayButtonClick(async () => {
    if (!player.init) {
        initAudioPlayer();
    }

    if (player.paused) {
        player.play();
        startVisualizer();
    } else {
        player.pause();
    }

    ui.changePlayButtonStatus(!player.paused);
});

// 进度控制事件
ui.listenProgressChange((progress) => {
    player.currentTime = player.duration * (progress / 100);
});

// 音量滑动条输入事件处理函数
ui.listenVolumeChange((volume) => {
    player.volume = volume / 100;
});
