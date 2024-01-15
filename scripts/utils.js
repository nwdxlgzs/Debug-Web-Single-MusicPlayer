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



export function create2DSmoothedArray(data2D, windowSize) {
    const rows = data2D.length;
    const cols = data2D[0].length;
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            let sum = 0;
            let count = 0;
            for (
                let di = -Math.floor(windowSize / 2);
                di <= Math.floor(windowSize / 2);
                di++
            ) {
                for (
                    let dj = -Math.floor(windowSize / 2);
                    dj <= Math.floor(windowSize / 2);
                    dj++
                ) {
                    // 计算环形索引
                    let rowIndex = (i + di + rows) % rows;
                    let colIndex = (j + dj + cols) % cols;

                    // 累加邻近值
                    sum += data2D[rowIndex][colIndex];
                    count++;
                }
            }
            // 计算平均值并赋值给平滑数组
            data2D[i][j] = Math.round(sum / count);
        }
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
