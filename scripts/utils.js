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



/**
 *
 * @param {string} hexString
 * @returns {Uint8Array}
 */
export function hexStringToByteArray(hexString) {
    const byteArray = [];
    for (let i = 0; i < hexString.length; i += 2) {
        byteArray.push(parseInt(hexString.substring(i, i + 2), 16));
    }
    return new Uint8Array(byteArray);
}

/**
 *
 * @param {Uint8Array} byteArray
 * @returns {ArrayBuffer}
 */
export function byteArrayToArrayBuffer(byteArray) {
    const arrayBuffer = new ArrayBuffer(byteArray.length);
    const uint8Array = new Uint8Array(arrayBuffer);
    uint8Array.set(byteArray);
    return arrayBuffer;
}

/**
 *
 * @param {string} hexString
 * @returns {ArrayBuffer}
 */
export function hexStringToArrayBuffer(hexString) {
    return byteArrayToArrayBuffer(hexStringToByteArray(hexString));
}


export function create2DSmoothedArray(data2D, windowSize) {
    const rows = data2D.length;
    const cols = data2D[0].length;
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            let sum = 0;
            let count = 0;
            for (let di = -Math.floor(windowSize / 2); di <= Math.floor(windowSize / 2); di++) {
                for (let dj = -Math.floor(windowSize / 2); dj <= Math.floor(windowSize / 2); dj++) {
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
        throw new Error('Invalid input: dataArray cannot be empty and numSlices must be positive');
    }

    const rows = dataArray.length; // 数组中Uint8Array的个数
    const cols = dataArray[0].length; // 每个Uint8Array的长度
    const sliceSize = Math.floor(cols / numSlices); // 每个切片的大小，向上取整
    const slicedArrays = [];

    for (let slice = 0; slice < numSlices; slice++) {
        const startCol = slice * sliceSize;
        const endCol = Math.min(startCol + sliceSize, cols);

        // 创建新的Uint8Array来存放切片数据
        const newSlice = new Array(rows).fill(null).map(() => new Uint8Array(endCol - startCol));

        // 遍历每个Uint8Array，拷贝数据到切片
        for (let row = 0; row < rows; row++) {
            for (let col = startCol, newCol = 0; col < endCol; col++, newCol++) {
                newSlice[row][newCol] = dataArray[row][col];
            }
        }

        // 将切片添加到结果数组
        slicedArrays.push(newSlice);
    }

    return slicedArrays;
}


