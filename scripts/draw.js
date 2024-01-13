import { AUDIO_FFTSIZE } from './audioPlayer.js';
import { create2DSmoothedArray, sliceUint8ArrayVertically } from './utils.js';

/**
 *
 * @param {AnalyserNode} analyser
 * @param {HTMLCanvasElement} spectrumCanvas
 */
export function draw(analyser, spectrumCanvas) {
    const bufferLength = analyser.frequencyBinCount;
    let spectrum_Seq = []
    for (let i = 0; i < 8; i++) {
        spectrum_Seq[i] = new Uint8Array(bufferLength);
    }
    function NEXT_spectrum_Seq() {
        let lastArray = spectrum_Seq[spectrum_Seq.length - 1];
        for (let i = spectrum_Seq.length - 1; i > 0; i--) {
            spectrum_Seq[i] = spectrum_Seq[i - 1];
        }
        spectrum_Seq[0] = lastArray;
    }
    const spectrumCanvas_COLORS = ['#90E3F5', '#5C8AF4', '#BEABF0', '#E1A2E1'];
    const spectrumCanvas_SampleSize = Math.floor(bufferLength / spectrumCanvas_COLORS.length);
    const spectrumCanvas_canvasCtx = spectrumCanvas.getContext('2d');
    spectrumCanvas_canvasCtx.imageSmoothingEnabled = true;
    const MAX_FPS = 50;
    let lastTime = 0;
    const FPSDrawlogic = (time) => {
        requestAnimationFrame(FPSDrawlogic);
        NEXT_spectrum_Seq();
        analyser.getByteFrequencyData(spectrum_Seq[0]);
        if (time - lastTime < 1000 / MAX_FPS) {
            return;
        }
        drawVisualizer();
        lastTime = time;
    };
    function drawVisualizer() {
        {//spectrumCanvas的绘制任务
            const WIDTH = spectrumCanvas.width;
            const HEIGHT = spectrumCanvas.height;
            const centerX = WIDTH / 2;
            const centerY = HEIGHT / 2;
            spectrumCanvas_canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
            const canvasCtx = spectrumCanvas_canvasCtx;
            const canvas = spectrumCanvas;
            const Layers = spectrumCanvas_COLORS.length;
            let arrs = sliceUint8ArrayVertically(spectrum_Seq, Layers);
            const maxSampleSize = spectrumCanvas_SampleSize;
            const maxRadius = Math.min(WIDTH, HEIGHT) / 2;
            // 清除上一帧的画面
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
            for (let lay_i = 0; lay_i < Layers; lay_i++) {
                let dataArray = arrs[lay_i];
                create2DSmoothedArray(dataArray, dataArray.length);
                let sampledDataArray = dataArray[0];
                // 绘制填充区域
                let prevX = centerX; // 初始化 prevX
                let prevY = centerY; // 初始化 prevY
                canvasCtx.globalAlpha = 1.0;
                canvasCtx.beginPath();
                canvasCtx.moveTo(centerX, centerY);
                let FSTX = prevX;
                let FSTY = prevY;
                for (let i = 0; i < maxSampleSize; i++) {
                    const value = sampledDataArray[i] + 255;
                    const percent = value / (255 + 255);
                    const height = percent * maxRadius;
                    const angle = ((Math.PI * 2) / maxSampleSize) * i - 0.00005 * (lay_i + 1) * Math.PI * (lastTime % (2000 / 0.0002));
                    const x = centerX + height * Math.cos(angle);
                    const y = centerY + height * Math.sin(angle);
                    if (i === 0) {
                        prevX = x; // 设置第一个点为prevX
                        prevY = y; // 设置第一个点为prevY
                        FSTX = prevX;
                        FSTY = prevY;
                        canvasCtx.moveTo(x, y);
                    } else if (i === maxSampleSize - 1) {
                        canvasCtx.quadraticCurveTo(prevX, prevY, FSTX, FSTY);
                    } else {
                        const midpointX = (prevX + x) / 2;
                        const midpointY = (prevY + y) / 2;
                        canvasCtx.quadraticCurveTo(prevX, prevY, midpointX, midpointY);
                        prevX = x;
                        prevY = y;
                    }
                }
                canvasCtx.closePath();
                canvasCtx.fillStyle = `rgba(255,255,255,${0.7 / Layers})`;
                canvasCtx.fill();
                // 绘制边缘线
                prevX = centerX; // 初始化 prevX
                prevY = centerY; // 初始化 prevY
                canvasCtx.beginPath();
                canvasCtx.moveTo(centerX, centerY);
                FSTX = prevX;
                FSTY = prevY;
                for (let i = 0; i < maxSampleSize; i++) {
                    const value = sampledDataArray[i] + 255;
                    const percent = value / (255 + 255);
                    const height = percent * maxRadius + 4;
                    const angle = ((Math.PI * 2) / maxSampleSize) * i - 0.00005 * (lay_i + 1) * Math.PI * (lastTime % (2000 / 0.0002));
                    const x = centerX + height * Math.cos(angle);
                    const y = centerY + height * Math.sin(angle);
                    if (i === 0) {
                        prevX = x; // 设置第一个点为prevX
                        prevY = y; // 设置第一个点为prevY
                        FSTX = prevX;
                        FSTY = prevY;
                        canvasCtx.moveTo(x, y);
                    } else if (i === maxSampleSize - 1) {
                        canvasCtx.quadraticCurveTo(prevX, prevY, FSTX, FSTY);
                    } else {
                        const midpointX = (prevX + x) / 2;
                        const midpointY = (prevY + y) / 2;
                        canvasCtx.quadraticCurveTo(prevX, prevY, midpointX, midpointY);
                        prevX = x;
                        prevY = y;
                    }
                }
                canvasCtx.closePath();
                canvasCtx.strokeStyle = spectrumCanvas_COLORS[lay_i];
                canvasCtx.lineWidth = 3;
                canvasCtx.globalAlpha = 0.7;
                canvasCtx.stroke();
            }
        }

    }
    FPSDrawlogic();

}

