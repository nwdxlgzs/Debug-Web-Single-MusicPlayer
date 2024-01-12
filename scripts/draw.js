import { AUDIO_FFTSIZE } from './audioPlayer.js';
import { findMaxSubarrays } from './utils.js';
import SavitzkyGolay from './savitzky-golay.js';
const { Circle, Canvas, Path } = window.G;
const { line, curveCardinalClosed } = window.d3;
class Drawer {
    /**
     * @type {AnalyserNode}
     *
     */
    analyser = null;

    /**
     * @type {HTMLDivElement}
     */
    backgroundCanvas = null;

    status = true;

    rawBufferArray = new Uint8Array(0);

    /**
     * @type {number[]}
     *
     */
    calculatedData = [];

    /**
     * @type {import("@antv/g".Canvas)}
     *
     */
    canvas;

    constructor(analyser, backgroundCanvas) {
        this.analyser = analyser;
        this.backgroundCanvas = backgroundCanvas;

        const bufferLength = analyser.frequencyBinCount;
        this.rawBufferArray = new Uint8Array(bufferLength);
    }

    async start() {
        // use webgl canvas

        // 创建一个渲染器，这里使用 webgl
        // const webglRenderer = new window.G.WebGL.Renderer();
        // canvas2d
        const webglRenderer = new window.G.Canvas2D.Renderer();

        const options = {
            width: this.backgroundCanvas.getBoundingClientRect().width,
            height: this.backgroundCanvas.getBoundingClientRect().height,
            redis: this.backgroundCanvas.getBoundingClientRect().height * 0.25,
            cX: this.backgroundCanvas.getBoundingClientRect().width * 0.5,
            cY: this.backgroundCanvas.getBoundingClientRect().height * 0.5,
        };

        /**
         * @type {import("@antv/g").Canvas}
         */
        const canvas = new Canvas({
            container: this.backgroundCanvas.id,
            width: options.width,
            height: options.height,
            renderer: webglRenderer,
        });

        this.canvas = canvas;

        // await canvas.ready();

        canvas.on('ready', () => {
            // 帧率限制？
            const fps = 60;
            let lastTime = 0;
            const logic = (time) => {
                requestAnimationFrame(logic);
                if (time - lastTime < 1000 / fps) {
                    return;
                }
                let realFPS = 1000 / (time - lastTime);
                //   console.log('real fps', realFPS);
                this.invalidate(canvas, options);
                lastTime = time;
            };
            requestAnimationFrame(logic);
        });
    }

    invalidate(canvas, options) {
        if (!this.status) {
            return;
        }

        this.analyser.getByteFrequencyData(this.rawBufferArray);
        this.calculatedData = this.prepareData();

        this.draw(canvas, options);
    }

    /**
     * @param {InvalidateOptions} options
     * @param {import("@antv/g").Canvas} canvas

     * @returns
     */
    draw(canvas, options) {
        const dataArray = this.calculatedData;
        const abs = Math.abs,
            cos = Math.cos,
            sin = Math.sin,
            PI = Math.PI;

        const points = dataArray.map((currentData) => {
            /**
             * @type {Array<[number,number]>}
             */
            const pointCollection = []; //设置集合储存点

            for (let index = 0; index < currentData.length; index++) {
                let data = currentData[index];
                if (data < 0) {
                    data = 0;
                }
                if (data !== 0) {
                    // 高度
                    data = abs(data / 255) * options.redis * 0.75;
                }

                let dagIndex = 160 + index;

                const deg = (dagIndex % 360) * (360 / currentData.length);
                const l = cos((deg * PI) / 180);
                const t = sin((deg * PI) / 180);
                // 实际所在半径
                const r = options.redis + data;
                /* console.log(
                    data,
                    deg,
                    options.redis,
                    options.height,
                    options.cX,
                    l,
                    r,
                    options.cY,
                    t,
                    r
                );  */
                let point = [options.cX + l * r, options.cY + t * r];

                pointCollection.push(point); //将点放入集合之中
            }

            // console.log(pointCollection);

            return pointCollection;
        });

        canvas.removeChildren();

        const COLORS = ['#90E3F5', '#5C8AF4', '#BEABF0', '#E1A2E1'];

        for (
            let currentIndex = 0;
            currentIndex < points.length;
            currentIndex++
        ) {
            const pointCollection = points[currentIndex];

            //转曲线平滑
            const path = line()
                .x((d) => d[0])
                .y((d) => d[1])
                .curve(curveCardinalClosed)(pointCollection);

            /**
             * @type {import("@antv/g").Path}
             */
            const Path = window.G.Path;
            const pathEl = new Path({
                style: {
                    stroke: COLORS[currentIndex],
                    lineWidth: 2,
                    path,
                    fill: 'rgba(255,255,255,0.2)',
                    // fill: addColorOpacity(COLORS[currentIndex], 0.3)
                },
            });
            canvas.appendChild(pathEl);
        }
    }

    prepareData() {
        // 获取低频，高频，范围
        // 先切个大的

        const rawBufferArray = this.rawBufferArray;
        const sliceRawBufferArraySize = rawBufferArray.length / 3;

        const maxSampleSize = 120;

        return [
            // SavitzkyGolay 平滑算法

            SavitzkyGolay(rawBufferArray.slice(0, maxSampleSize), 12, {
                windowSize: 9,
            }),
            SavitzkyGolay(
                rawBufferArray.slice(
                    sliceRawBufferArraySize,
                    sliceRawBufferArraySize + maxSampleSize
                ),

                1,
                {
                    windowSize: 9,
                }
            ),
            SavitzkyGolay(
                rawBufferArray.slice(
                    sliceRawBufferArraySize * 2,
                    sliceRawBufferArraySize * 2 + maxSampleSize
                ),
                1,

                {
                    windowSize: 5,
                }
            ),
        ];
    }
}

/**
 *
 * @param {AnalyserNode} analyser
 * @param {HTMLCanvasElement} spectrumCanvas
 */
export function draw(analyser, spectrumCanvas) {
    const drawer = new Drawer(analyser, spectrumCanvas);

    drawer.start();

    /*  const bufferLength = analyser.frequencyBinCount;
    let dataArray = new Uint8Array(bufferLength);
    const WIDTH = spectrumCanvas.width;
    const HEIGHT = spectrumCanvas.height;
    const centerX = WIDTH / 2;
    const centerY = HEIGHT / 2;
    const maxRadius = Math.min(WIDTH, HEIGHT) / 2;
    const maxSampleSize = 180;
    const Layers = Math.floor(AUDIO_FFTSIZE / maxSampleSize);
    const canvasCtx = spectrumCanvas.getContext('2d');

    canvasCtx.imageSmoothingEnabled = true;
    const rgblayers = [
        [255, 0, 0],
        [255, 128, 0],
        [255, 255, 0],
        [0, 255, 0],
        [0, 128, 255],
        [0, 0, 255],
        [128, 0, 255],
        [255, 0, 255],
        [255, 0, 128],
    ];

    function drawVisualizer() {
        let midpointY;
        requestAnimationFrame(drawVisualizer);
        analyser.getByteFrequencyData(dataArray);
        //  console.log(dataArray.filter((t) => t > 0));
        const RawBaseArrayAver =
            dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;

        function smoothData(dataArray, smoothingPasses, deeplayer) {
            const baseValue =
                dataArray.reduce((acc, val) => acc + val, 0) /
                    (3 * dataArray.length) +
                RawBaseArrayAver +
                deeplayer;
            let adjustedData = dataArray.map((val) => val + baseValue);
            let smoothedData = [...adjustedData];
            for (let pass = 0; pass < smoothingPasses; pass++) {
                let tempArray = [...smoothedData];
                for (let i = 0; i < dataArray.length; i++) {
                    let prevIndex = i > 0 ? i - 1 : dataArray.length - 1;
                    let nextIndex = i < dataArray.length - 1 ? i + 1 : 0;
                    smoothedData[i] =
                        (tempArray[prevIndex] +
                            tempArray[i] +
                            tempArray[nextIndex]) /
                        3;
                }
            }
            smoothedData = smoothedData.map((val) => val - 0);
            return smoothedData;
        }

        canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
        for (let lay_i = 0; lay_i < Layers; lay_i++) {
            let sampledDataArray = dataArray.slice(
                lay_i * maxSampleSize,
                (lay_i + 1) * maxSampleSize
            );
            // 在drawVisualizer函数中，在绘制前对sampledDataArray应用平滑函数
            sampledDataArray = smoothData(
                sampledDataArray,
                maxSampleSize / 4,
                lay_i
            );
            let prevX = centerX; // 初始化 prevX
            let prevY = centerY; // 初始化 prevY

            canvasCtx.beginPath();
            canvasCtx.moveTo(centerX, centerY);

            // 使用二次贝塞尔曲线平滑连接点
            for (let i = 0; i < maxSampleSize; i++) {
                let value = sampledDataArray[maxSampleSize - i - 1]; // 反向取样用于绘制左侧
                let percent = value / 255;
                let height = percent * maxRadius;
                let angle = ((Math.PI * 2) / maxSampleSize) * i;
                angle = angle / 2 - Math.PI / 2;
                let x = centerX + height * Math.cos(angle);
                let y = centerY + height * Math.sin(angle);

                if (i === 0) {
                    canvasCtx.moveTo(x, y);
                } else {
                    let midpointX = (prevX + x) / 2;
                    midpointY = (prevY + y) / 2;
                    canvasCtx.quadraticCurveTo(
                        prevX,
                        prevY,
                        midpointX,
                        midpointY
                    );
                }

                prevX = x;
                prevY = y;
            }

            // 绘制右侧的对称部分
            for (let i = 0; i < maxSampleSize; i++) {
                const value = sampledDataArray[i]; // 正向取样用于绘制右侧
                const percent = value / 255;
                const height = percent * maxRadius;
                let angle = ((Math.PI * 2) / maxSampleSize) * i;
                angle = angle / 2 + Math.PI / 2;
                const x = centerX + height * Math.cos(angle);
                const y = centerY + height * Math.sin(angle);
                if (i === maxSampleSize - 1) {
                    canvasCtx.moveTo(x, y);
                } else {
                    const midpointX = (prevX + x) / 2;
                    midpointY = (prevY + y) / 2;
                    canvasCtx.quadraticCurveTo(
                        prevX,
                        prevY,
                        midpointX,
                        midpointY
                    );
                }
                prevX = x;
                prevY = y;
            }

            canvasCtx.lineTo(centerX, centerY);
            canvasCtx.closePath();
            // canvasCtx.fillStyle = 'rgba(0, 255, 255, 1)';
            const coloi = lay_i % rgblayers.length;
            canvasCtx.fillStyle = `rgba(${rgblayers[coloi][0]}, ${rgblayers[coloi][1]}, ${rgblayers[coloi][2]}, 1)`;
            canvasCtx.fill();
        }
    }

    drawVisualizer(); */
}

/**
 * @typedef {Object} InvalidateOptions
 * @property {number} width width of canvas
 * @property {number} height height of canvas
 * @property {number} radius radius
 */
