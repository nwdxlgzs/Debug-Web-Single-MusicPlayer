import { AUDIO_FFTSIZE } from './audioPlayer.js';

// TODO: Better Draw Class

/**
 *
 * @param {AnalyserNode} analyser
 * @param {HTMLCanvasElement} spectrumCanvas
 */
export function draw(analyser, spectrumCanvas) {
    const bufferLength = analyser.frequencyBinCount;
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

    drawVisualizer();
}
