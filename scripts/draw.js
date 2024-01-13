import { AUDIO_FFTSIZE } from './audioPlayer.js';
import { create2DSmoothedArray, sliceUint8ArrayVertically, MyIntQueue } from './utils.js';
import { quantize } from './quantize.js';
class SpectrumCanvasBubble {
    constructor(ctx, x, y) {
        this.ctx = ctx;
        this.x = x;
        this.y = y;
        this.radius = 1;
        this.maxRadius = Math.random() * 15 + 20; // 最大半径
        this.growFactor = Math.random() * 0.07 + 1;  // 成长速度
        this.speedX = (Math.random() - 0.5) * 8;
        this.speedY = (Math.random() - 0.5) * 8;
        this.alpha = 1;
        this.shrink = false; // 是否开始缩小
    }
    update() {
        // 控制气泡增长直到达到最大半径
        if (!this.shrink) {
            // 增长
            if (this.radius < this.maxRadius) {
                this.radius += this.growFactor;
            } else {
                // 达到最大半径，开始缩小
                this.shrink = true;
            }
        } else {
            // 缩小
            this.radius -= this.growFactor * 0.7;
            this.alpha -= 0.005; // 开始变得更加透明
        }
        // 更新位置
        this.x += this.speedX;
        this.y += this.speedY;
        // 如果半径小于等于0或者完全透明，则将其移出数组
        if (this.radius <= 0 || this.alpha <= 0) {
            this.radius = 0;
            this.alpha = 0;
        }
    }
    draw() {
        const ctx = this.ctx;
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.restore();
    }
}
/**
 *
 * @param {AnalyserNode} analyser
 * @param {HTMLCanvasElement} spectrumCanvas
 * @param {HTMLImageElement} coverImage
 * @param {HTMLDivElement} coverImageContainer
 * @param {HTMLCanvasElement} bottomSpectrumCanvas
 */
export function draw(analyser, spectrumCanvas, coverImage, coverImageContainer, bottomSpectrumCanvas) {
    const SpectrumCanvasBubbles = [];
    var MainColorForCover = [255, 255, 255];
    {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const width = canvas.width = coverImage.naturalWidth;
        const height = canvas.height = coverImage.naturalHeight;
        context.drawImage(coverImage, 0, 0, width, height);
        const imageData = context.getImageData(0, 0, width, height)
        const pixelCount = width * height;
        const pixels = imageData.data;
        const pixelArray = [];
        const quality = 10 // 间隔，如果图片很大时每个像素值都取可能会对性能有所影响，所以按自己需求设置间隔多少像素点取一个值
        for (let i = 0, offset, r, g, b, a; i < pixelCount; i = i + quality) {
            offset = i * 4;
            r = pixels[offset + 0];
            g = pixels[offset + 1];
            b = pixels[offset + 2];
            a = pixels[offset + 3];
            if (typeof a === 'undefined' || a >= 125) {
                pixelArray.push([r, g, b]);
            }
        }
        try {
            MainColorForCover = quantize(pixelArray, 2).palette()[0];
        } catch (e) { }
    }
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
    let history_Seq_averages = new MyIntQueue(256, 0);
    const spectrumCanvas_COLORS = ['#90E3F5', '#5C8AF4', '#BEABF0', '#E1A2E1'];
    const spectrumCanvas_SampleSize = Math.floor(bufferLength / spectrumCanvas_COLORS.length);
    const spectrumCanvas_canvasCtx = spectrumCanvas.getContext('2d');
    spectrumCanvas_canvasCtx.imageSmoothingEnabled = true;
    const bottomSpectrumCanvas_canvasCtx = bottomSpectrumCanvas.getContext('2d');
    bottomSpectrumCanvas_canvasCtx.imageSmoothingEnabled = true;
    const MAX_FPS = 50;
    let lastTime = 0;
    const FPSDrawlogic = (time) => {
        requestAnimationFrame(FPSDrawlogic);
        NEXT_spectrum_Seq();
        analyser.getByteFrequencyData(spectrum_Seq[0]);
        history_Seq_averages.push(spectrum_Seq[0].reduce((accumulator, currentValue) => {
            return accumulator + currentValue;
        }) / spectrum_Seq[0].length);
        if (time - lastTime < 1000 / MAX_FPS) {
            return;
        }
        drawVisualizer();
        lastTime = time;
    };
    function drawVisualizer() {
        const average = history_Seq_averages.gettopobj();
        let sum_smoothaverage = 0;
        //spectrumCanvas的绘制任务
        {
            const WIDTH = spectrumCanvas.width;
            const HEIGHT = spectrumCanvas.height;
            const centerX = WIDTH / 2;
            const centerY = HEIGHT / 2;
            // 清除上一帧的画面
            spectrumCanvas_canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
            const canvasCtx = spectrumCanvas_canvasCtx;
            const Layers = spectrumCanvas_COLORS.length;
            let arrs = sliceUint8ArrayVertically(spectrum_Seq, Layers);
            const maxSampleSize = spectrumCanvas_SampleSize;
            const maxRadius = Math.min(WIDTH, HEIGHT) / 2;
            {//气泡绘制
                while (SpectrumCanvasBubbles.length < average) {
                    SpectrumCanvasBubbles.push(new SpectrumCanvasBubble(canvasCtx, centerX, centerY));
                }
                SpectrumCanvasBubbles.forEach((bubble, index) => {
                    bubble.update();
                    bubble.draw();
                    // 移除消失的气泡
                    if (bubble.alpha <= 0) {
                        SpectrumCanvasBubbles.splice(index, 1);
                    }
                });
            }
            for (let lay_i = 0; lay_i < Layers; lay_i++) {
                let dataArray = arrs[lay_i];
                create2DSmoothedArray(dataArray, dataArray.length);
                let sampledDataArray = dataArray[0];
                const grow_aversum = sampledDataArray.reduce((accumulator, currentValue) => {
                    return accumulator + currentValue;
                });
                sum_smoothaverage += grow_aversum;
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
                    const percent = (value / (255 + 255));
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
                canvasCtx.fillStyle = `rgba(${MainColorForCover[0]},${MainColorForCover[1]},${MainColorForCover[2]},${0.8 / Layers})`;
                // canvasCtx.fillStyle = `rgba(255,255,255,${0.8 / Layers})`;
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
                    const height = percent * maxRadius + 8;
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
        //coverImage旋转和缩放任务
        {
            const sampledDataArray = spectrum_Seq[0];
            const average = sum_smoothaverage / sampledDataArray.length;
            const scale = 1 + (average / 600);
            // coverImage.style.transform = `rotate(${(lastTime / 30000 * 360) % 360}deg)`;
            coverImage.style.transform = `scale(${scale}) rotate(${(lastTime / 30000 * 360) % 360}deg)`;
            coverImageContainer.style.height = `${scale * 35}vh`;
            coverImageContainer.style.width = `${scale * 35}vh`;
        }
        {//bottomSpectrumCanvas的绘制任务
            const WIDTH = bottomSpectrumCanvas.width;
            const HEIGHT = bottomSpectrumCanvas.height;
            const centerX = WIDTH / 2;
            const centerY = HEIGHT / 2;
            const canvasCtx = bottomSpectrumCanvas_canvasCtx;
            const maxSampleSize = history_Seq_averages.length;
            const dataArray = spectrum_Seq[0];
            // 清除上一帧的画面
            bottomSpectrumCanvas_canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
            // 设置绘制波形线条的样式
            canvasCtx.lineWidth = 1;
            canvasCtx.strokeStyle = 'black';
            // 开始绘制路径
            canvasCtx.beginPath();
            // 根据采样数据数量调整sliceWidth
            var sliceWidth = WIDTH / maxSampleSize;
            var x = 0;
            const SqeSampSize = bufferLength / maxSampleSize;
            canvasCtx.moveTo(x, centerY + (history_Seq_averages.get(i,10) / 128.0) * centerY / 2 +spectrum_Seq[0][0]/5);
            // canvasCtx.moveTo(x, centerY);
            // x += sliceWidth * 10;
            // canvasCtx.lineTo(x, centerY);
            // 通过循环sampledDataArray来绘制波形线
            for (var i = 1; i < maxSampleSize; i++) {
                var v = history_Seq_averages.get(i,10) / 128.0;
                var y = v * centerY / 2 + spectrum_Seq[0][Math.floor(i*SqeSampSize)]/5;
                // 绘制线条
                canvasCtx.lineTo(x, centerY - y);
                x += sliceWidth;
                // canvasCtx.lineTo(x, centerY + y);
            }
            // 完成路径
            // canvasCtx.lineTo(WIDTH, centerY);
            canvasCtx.stroke();
        }

    }
    FPSDrawlogic();

}

