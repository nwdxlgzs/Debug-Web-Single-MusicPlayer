/**
 *
 * @param {number} time
 * @returns
 */
export function formatTime(time) {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);

    const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;
    return `${minutes}:${formattedSeconds}`;
}



// export function create2DSmoothedArray(data2D, windowSize) {
//     const rows = data2D.length;
//     const cols = data2D[0].length;
//     for (let i = 0; i < rows; i++) {
//         for (let j = 0; j < cols; j++) {
//             let sum = 0;
//             let count = 0;
//             for (
//                 let di = -Math.floor(windowSize / 2);
//                 di <= Math.floor(windowSize / 2);
//                 di++
//             ) {
//                 for (
//                     let dj = -Math.floor(windowSize / 2);
//                     dj <= Math.floor(windowSize / 2);
//                     dj++
//                 ) {
//                     // 计算环形索引
//                     let rowIndex = (i + di + rows) % rows;
//                     let colIndex = (j + dj + cols) % cols;

//                     // 累加邻近值
//                     sum += data2D[rowIndex][colIndex];
//                     count++;
//                 }
//             }
//             // 计算平均值并赋值给平滑数组
//             data2D[i][j] = Math.round(sum / count);
//         }
//     }
// }
//目前的真神
export function create2DSmoothedArray(data2D, windowSize) {
    const rows = data2D.length;
    const cols = data2D[0].length;
    const Zhw = Math.floor(windowSize / 2);
    const count = Math.pow(windowSize, 2);
    // 使用变量跟踪边界值，以避免模运算
    for (let i = 0; i < (rows > 6 ? rows / 2 : 3); i++) {
        for (let j = 0; j < cols; j += 2) {//第一次只算偶数位
            let sum = 0;
            for (let di = -Zhw; di <= Zhw; di++) {
                let rowIndex = i + di;
                // 检查是否超出上下界限
                if (rowIndex < 0) rowIndex += rows;
                if (rowIndex >= rows) rowIndex -= rows;

                for (let dj = -Zhw; dj <= Zhw; dj++) {
                    let colIndex = j + dj;
                    // 检查是否超出左右界限
                    if (colIndex < 0) colIndex += cols;
                    if (colIndex >= cols) colIndex -= cols;
                    sum += data2D[rowIndex][colIndex];
                }
            }
            data2D[i][j] = Math.round(sum / count);
        }
    }
    for (let j = 1; j < cols; j += 2) {//奇数位靠偶数位平滑
        let sum = data2D[0][j - 1] + data2D[0][(j + 1) % cols];
        data2D[0][j] = Math.round(sum / 2);
    }
}

export function sliceUint8ArrayVertically(dataArray, numSlices) {
    if (dataArray.length === 0 || numSlices <= 0) {
        throw new Error(
            'Invalid input: dataArray cannot be empty and numSlices must be positive'
        );
    }

    const rows = dataArray.length; // 数组中Uint8Array的个数
    const cols = dataArray[0].length; // 每个Uint8Array的长度
    const sliceSize = Math.floor(cols / numSlices); // 每个切片的大小，向上取整
    const slicedArrays = [];

    for (let slice = 0; slice < numSlices; slice++) {
        const startCol = slice * sliceSize;
        const endCol = Math.min(startCol + sliceSize, cols);

        // 创建新的Uint8Array来存放切片数据
        const newSlice = new Array(rows)
            .fill(null)
            .map(() => new Uint8Array(endCol - startCol));

        // 遍历每个Uint8Array，拷贝数据到切片
        for (let row = 0; row < rows; row++) {
            for (
                let col = startCol, newCol = 0;
                col < endCol;
                col++, newCol++
            ) {
                newSlice[row][newCol] = dataArray[row][col];
            }
        }

        // 将切片添加到结果数组
        slicedArrays.push(newSlice);
    }

    return slicedArrays;
}

export class IntQueue {
    constructor(maxLength, initialData = 0) {
        this.maxLength = maxLength;
        this.buffer = new Array(maxLength).fill(initialData);
    }

    push(item) {
        if (this.buffer.length === this.maxLength) {
            this.buffer.shift(); // 移除最早的元素
        }
        this.buffer.push(item); // 压入新的元素
    }

    get(index) {
        if (index < 0 || index >= this.buffer.length) {
            throw new Error('Index out of bounds');
        }
        return this.buffer[index];
    }

    getWithSmooth(index, smoothWindowSize) {
        if (index < 0 || index >= this.buffer.length) {
            throw new Error(
                'Index out of bounds : length = ' +
                this.buffer.length +
                ' index = ' +
                index
            );
        }
        if (smoothWindowSize < 0) {
            throw new Error('Size must be a non-negative value');
        }
        if (
            smoothWindowSize === 0 ||
            (index >= smoothWindowSize &&
                index < this.buffer.length - smoothWindowSize)
        ) {
            return this.buffer[index];
        }
        if (index < smoothWindowSize) {
            return (this.buffer[index] * (index + 1)) / (smoothWindowSize + 1);
        }
        if (index >= this.buffer.length - smoothWindowSize) {
            return (
                (this.buffer[index] * (this.buffer.length - index)) /
                (smoothWindowSize + 1)
            );
        }
    }

    first() {
        if (this.buffer.length === 0) {
            throw new Error('Buffer is empty');
        }
        return this.buffer[this.buffer.length - 1];
    }
    get length() {
        return this.buffer.length;
    }
}
export function rgbToHsv(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, v = max;
    let d = max - min;
    s = max === 0 ? 0 : d / max;
    if (max === min) {
        h = 0; // achromatic
    } else {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h, s, v];
}

export function hsvToRgb(h, s, v) {
    let r, g, b, i, f, p, q, t;
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
export function makeDarker(rgb, percentage) {
    let [r, g, b] = rgb;
    // 转换RGB到HSV
    let [h, s, v] = rgbToHsv(r, g, b);
    // 减少亮度V
    v = Math.max(v - (v * (percentage / 100)), 0);
    // 转换HSV回RGB
    return hsvToRgb(h, s, v);
}