import { AUDIO_FFTSIZE } from './audioPlayer.js';
import {
    create2DSmoothedArray,
    sliceUint8ArrayVertically,
    IntQueue,
} from './utils.js';
import * as ui from './ui.js';
import { quantize } from './quantize.js';

class SpectrumCanvasBubble {
    constructor(ctx, x, y) {
        this.ctx = ctx;
        this.x = x;
        this.y = y;
        this.radius = 1;
        this.maxRadius = Math.random() * 20 + 15; // 最大半径
        this.growFactor = Math.random() * 0.05 + 1; // 成长速度
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
        ctx.fillStyle = window.attach.recvData.bubblesColor ?? 'white';
        ctx.fill();
        ctx.restore();
    }
}

let STORE_palettes = null;
const CoverImageEle = document.getElementById('cover-image');
CoverImageEle.addEventListener('load', function () {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const width = (canvas.width = this.naturalWidth);
    const height = (canvas.height = this.naturalHeight);
    context.drawImage(this, 0, 0, width, height);
    const imageData = context.getImageData(0, 0, width, height);
    const pixelCount = width * height;
    const pixels = imageData.data;
    const pixelArray = [];
    const quality = 10; // 间隔，如果图片很大时每个像素值都取可能会对性能有所影响，所以按自己需求设置间隔多少像素点取一个值
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
        const palettes = quantize(pixelArray, 2).palette();
        STORE_palettes = palettes;
        if (window.attach.recvData.waveCircleConfig.fillColor === 'cover') {
            const coverThemeIndex_ = window.attach.recvData.waveCircleConfig.coverThemeIndex;
            window.attach.MainColorForCover = palettes[(coverThemeIndex_ ?? 1) >= palettes.length ? 0 : coverThemeIndex_];
        }
        if (window.attach.recvData.backgroundType === 'gradient' &&
            window.attach.recvData.BGGradientConfig.colorSource === 'cover') {
            const coverThemeIndex = window.attach.recvData.BGGradientConfig.coverThemeIndex;
            ui.setGradientBackgroundColor(
                palettes[(coverThemeIndex ?? 1) >= palettes.length ? 0 : coverThemeIndex]
            );
        }
    } catch (e) { }
});
CoverImageEle.src = window.attach.COVER_IMAGE_URL;
/**
 *
 * @param {AnalyserNode} analyser
 * @param {HTMLCanvasElement} spectrumCanvas
 * @param {HTMLImageElement} coverImage
 * @param {HTMLDivElement} coverImageContainer
 * @param {HTMLCanvasElement} topSpectrumCanvas
 * @param {HTMLCanvasElement} bottomSpectrumCanvas
 */
let lastDrawFPSDrawlogic = null;
const SpectrumCanvasBubbles = [];
let spectrum_Seq = [];
function NEXT_spectrum_Seq() {
    let lastArray = spectrum_Seq[spectrum_Seq.length - 1];
    for (let i = spectrum_Seq.length - 1; i > 0; i--) {
        spectrum_Seq[i] = spectrum_Seq[i - 1];
    }
    spectrum_Seq[0] = lastArray;
}
let history_Seq_averages = new IntQueue(64, 0);
let spectrumCanvas_COLORS = ['#90E3F5', '#5C8AF4', '#BEABF0', '#E1A2E1'];
spectrumCanvas_COLORS = window.attach.recvData.waveCircleConfig.lineColors;
const MAX_FPS = 50;
let lastTime = 0;
export function draw(
    analyser,
    spectrumCanvas,
    coverImage,
    coverImageContainer,
    topSpectrumCanvas,
    bottomSpectrumCanvas,
    BackgroundElem
) {
    const bufferLength = analyser.frequencyBinCount;
    if (spectrum_Seq.length == 0) {
        for (let i = 0; i < 8; i++) {
            spectrum_Seq[i] = new Uint8Array(bufferLength);
        }
    }
    const timeDomainDataArray = new Uint8Array(bufferLength);
    const spectrumCanvas_SampleSize = Math.floor(
        bufferLength / spectrumCanvas_COLORS.length
    );
    const spectrumCanvas_canvasCtx = spectrumCanvas.getContext('2d');
    spectrumCanvas_canvasCtx.imageSmoothingEnabled = true;
    const bottomSpectrumCanvas_canvasCtx =
        bottomSpectrumCanvas.getContext('2d');
    bottomSpectrumCanvas_canvasCtx.imageSmoothingEnabled = true;
    const topSpectrumCanvas_canvasCtx = topSpectrumCanvas.getContext('2d');
    topSpectrumCanvas_canvasCtx.imageSmoothingEnabled = true;



    const FPSDrawlogic = (time) => {
        lastDrawFPSDrawlogic = requestAnimationFrame(FPSDrawlogic);
        NEXT_spectrum_Seq();
        analyser.getByteFrequencyData(spectrum_Seq[0]);
        history_Seq_averages.push(
            spectrum_Seq[0].reduce((accumulator, currentValue) => {
                return accumulator + currentValue;
            }) / spectrum_Seq[0].length
        );
        if (time - lastTime < 1000 / MAX_FPS) {
            return;
        }
        analyser.getByteTimeDomainData(timeDomainDataArray);
        drawVisualizer();
        lastTime = time;
    };

    function drawVisualizer() {
        const average = history_Seq_averages.first();
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
            const maxSampleSize = spectrumCanvas_SampleSize;
            const maxRadius = Math.min(WIDTH, HEIGHT) / 2;
            canvasCtx.globalAlpha = 1.0;
            if (window.attach.WITH_BUBBLES) {
                //气泡绘制
                while (SpectrumCanvasBubbles.length < average) {
                    SpectrumCanvasBubbles.push(
                        new SpectrumCanvasBubble(canvasCtx, centerX, centerY)
                    );
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
            if (window.attach.WAVE_LINELIKE === 'line' || window.attach.WAVE_LINELIKE === 'mirror-line') {
                const SEQ = spectrum_Seq[0];
                const barWidth = window.attach.recvData.waveLineConfig.barWidth;
                const gap = window.attach.recvData.waveLineConfig.gapWidth;
                const flip = window.attach.recvData.waveLineConfig.flip;
                const mirror = window.attach.WAVE_LINELIKE === 'mirror-line';


                const radius = 190;
                const circumference = 2 * Math.PI * radius;
                const numBarsWhole = Math.floor(circumference / (barWidth + gap));
                const numBars = mirror ? numBarsWhole / 2 : numBarsWhole; // 根据mirror决定柱子数量
                const step = Math.floor(SEQ.length / numBars);

                for (let i = 0; i < numBars; i++) {
                    const startIndex = i * step;
                    const endIndex = startIndex + step;
                    const segment = SEQ.slice(startIndex, Math.min(endIndex, SEQ.length));
                    const averageMagnitude = (segment.reduce((sum, value) => sum + value, 0) / segment.length) / 1.3 + 3;
                    // 绘制柱子的函数
                    const drawBar = (angle) => {
                        const x1 = centerX + radius * Math.cos(angle);
                        const y1 = centerY + radius * Math.sin(angle);
                        const x2 = centerX + (radius + averageMagnitude) * Math.cos(angle);
                        const y2 = centerY + (radius + averageMagnitude) * Math.sin(angle);
                        canvasCtx.beginPath();
                        canvasCtx.moveTo(x1, y1);
                        canvasCtx.lineTo(x2, y2);
                        if (window.attach.recvData.waveLineConfig.color === 'rainbow') {
                            canvasCtx.strokeStyle = `hsl(${(i / numBarsWhole) * 360}, 100%, 50%)`;
                        } else if (window.attach.recvData.waveLineConfig.color === 'cover') {
                            const coverThemeIndex = window.attach.recvData.waveLineConfig.coverThemeIndex;
                            const rgb = STORE_palettes[(coverThemeIndex ?? 1) >= STORE_palettes.length ? 0 : coverThemeIndex];
                            canvasCtx.strokeStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
                        } else {
                            canvasCtx.strokeStyle = window.attach.recvData.waveLineConfig.color ?? 'white';
                        }
                        canvasCtx.lineWidth = barWidth;
                        canvasCtx.stroke();
                    };
                    if (mirror) {
                        // 镜像情况下，绘制两条柱子
                        const angle = ((barWidth + gap) / circumference) * i * 2 * Math.PI - Math.PI / 2;
                        drawBar(angle + (flip ? Math.PI : 0));
                        drawBar(-angle + Math.PI + (flip ? Math.PI : 0));
                    } else {
                        // 非镜像情况，绘制一条柱子
                        const angle = (i * (barWidth + gap) * 2 * Math.PI / circumference) - Math.PI / 2;
                        drawBar(angle + (flip ? Math.PI : 0));
                    }
                }
            }
            let arrs = sliceUint8ArrayVertically(spectrum_Seq, Layers);
            if (window.attach.WAVE_CRICLE === 'show') {
                for (let lay_i = 0; lay_i < Layers; lay_i++) {
                    let dataArray = arrs[lay_i];
                    create2DSmoothedArray(dataArray, dataArray.length);
                    let sampledDataArray = dataArray[0];
                    const grow_aversum = sampledDataArray.reduce(
                        (accumulator, currentValue) => {
                            return accumulator + currentValue;
                        }
                    );
                    sum_smoothaverage += grow_aversum;
                    // 绘制填充区域
                    let prevX = centerX; // 初始化 prevX
                    let prevY = centerY; // 初始化 prevY
                    canvasCtx.beginPath();
                    canvasCtx.moveTo(centerX, centerY);
                    let FSTX = prevX;
                    let FSTY = prevY;
                    let baseValue = 255;
                    if (window.attach.COVER_SCALE) {
                        const average = (lay_i + 1) * sum_smoothaverage / dataArray.length;
                        baseValue += average / 255;
                    }
                    for (let i = 0; i < maxSampleSize; i++) {
                        const value = sampledDataArray[i] + baseValue;
                        const percent = value / (255 + baseValue);
                        const height = percent * maxRadius;
                        const angle =
                            ((Math.PI * 2) / maxSampleSize) * i -
                            0.00005 *
                            (lay_i + 1) *
                            Math.PI *
                            (lastTime % (2000 / 0.0002));
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
                            canvasCtx.quadraticCurveTo(
                                prevX,
                                prevY,
                                midpointX,
                                midpointY
                            );
                            prevX = x;
                            prevY = y;
                        }
                    }
                    canvasCtx.closePath();
                    canvasCtx.fillStyle = `rgba(${window.attach.MainColorForCover[0]},${window.attach.MainColorForCover[1]
                        },${window.attach.MainColorForCover[2]},${window.attach.recvData.waveCircleConfig.fillAlphaDeep / Layers})`;
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
                        const value = sampledDataArray[i] + baseValue;
                        const percent = value / (255 + baseValue);
                        const height = percent * maxRadius + 8;
                        const angle =
                            ((Math.PI * 2) / maxSampleSize) * i -
                            0.00005 *
                            (lay_i + 1) *
                            Math.PI *
                            (lastTime % (2000 / 0.0002));
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
                            canvasCtx.quadraticCurveTo(
                                prevX,
                                prevY,
                                midpointX,
                                midpointY
                            );
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
            } else {
                for (let lay_i = 0; lay_i < Layers; lay_i++) {
                    let dataArray = arrs[lay_i];
                    create2DSmoothedArray(dataArray, dataArray.length);
                    let sampledDataArray = dataArray[0];
                    const grow_aversum = sampledDataArray.reduce(
                        (accumulator, currentValue) => {
                            return accumulator + currentValue;
                        }
                    );
                    sum_smoothaverage += grow_aversum;
                }
            }
        }
        //coverImage旋转和缩放任务
        {
            const sampledDataArray = spectrum_Seq[0];
            const average = sum_smoothaverage / sampledDataArray.length;
            const scale = 1 + average / 600;
            // coverImage.style.transform = `rotate(${(lastTime / 30000 * 360) % 360}deg)`;
            if (window.attach.COVER_SCALE && window.attach.COVER_ROTATE) {
                coverImage.style.transform = `scale(${scale}) rotate(${((lastTime / 30000) * 360) % 360}deg)`;
            } else if (window.attach.COVER_ROTATE) {
                coverImage.style.transform = `rotate(${((lastTime / 30000) * 360) % 360}deg)`;
            } else if (window.attach.COVER_SCALE) {
                coverImage.style.transform = `scale(${scale})`;
            }
            if (window.attach.COVER_SCALE) {
                coverImageContainer.style.height = `${scale * 35}vh`;
                coverImageContainer.style.width = `${scale * 35}vh`;
                if (window.attach.recvData.BGMusicScale !== undefined && window.attach.recvData.BGMusicScale !== null &&
                    window.attach.recvData.BGMusicScale > 0) {
                    const scaleR = 1 + (window.attach.recvData.BGMusicScale * average) / 255;
                    BackgroundElem.style.transform = `scale(${(scaleR)})`;
                }
            }
        }
        {
            //topSpectrumCanvas的绘制任务
            const WIDTH = topSpectrumCanvas.width;
            const HEIGHT = topSpectrumCanvas.height;
            const canvasCtx = topSpectrumCanvas_canvasCtx;
            const dataArray = spectrum_Seq[0];
            // 清除上一帧的画面
            canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
            let x = 0;

            // 循环通过dataArray来绘制圆点
            for (let i = 0; i < bufferLength; i++) {
                // 用dataArray中的值作为圆点的Y坐标
                const y = HEIGHT - dataArray[i];

                let radius = (dataArray[i] / 255) * 5;
                if (radius < 3) {
                    radius = 3;
                } else if (radius > 5) {
                    radius = 5;
                }

                // 开始绘制路径
                canvasCtx.beginPath();
                // 画一个圆：arc(x, y, radius, startAngle, endAngle)
                canvasCtx.arc(x, y, radius, 0, 2 * Math.PI);
                // 设置圆点的颜色
                canvasCtx.fillStyle = `rgba(255, 255, 255, ${(dataArray[i] + 10) / (255 + 10)
                    })`;
                // 填充圆点
                canvasCtx.fill();
                x += 2 * radius + 1;
                if (x > WIDTH) {
                    break;
                }
            }
        }
        {
            //bottomSpectrumCanvas的绘制任务
            const WIDTH = bottomSpectrumCanvas.width;
            const HEIGHT = bottomSpectrumCanvas.height;
            const canvasCtx = bottomSpectrumCanvas_canvasCtx;
            const dataArray = timeDomainDataArray;
            // 清除上一帧的画面
            canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

            // 创建渐变
            const gradient = canvasCtx.createLinearGradient(0, 0, WIDTH, 0);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
            gradient.addColorStop(0.3, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(0.7, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

            canvasCtx.lineWidth = 2;
            // 将渐变设置为stroke样式
            canvasCtx.strokeStyle = gradient;

            // 开始绘制路径
            canvasCtx.beginPath();
            const sliceWidth = WIDTH / bufferLength;
            let x = 0;
            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 256.0;
                const y = (v * HEIGHT) / 2 + HEIGHT / 2; // 让波形居中显示
                if (i === 0) {
                    canvasCtx.moveTo(x, y);
                } else {
                    canvasCtx.lineTo(x, y);
                }
                x += sliceWidth;
            }
            // 画到canvas上
            canvasCtx.lineTo(WIDTH, HEIGHT / 2); // 确保线的最后部分也有渐变
            canvasCtx.stroke();
        }
    }
    if (lastDrawFPSDrawlogic != null) {
        cancelAnimationFrame(lastDrawFPSDrawlogic);
    }
    FPSDrawlogic();
}
