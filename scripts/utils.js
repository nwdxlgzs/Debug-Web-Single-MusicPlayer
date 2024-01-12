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
 * 在一组数中，寻找前 k 个最大的窗口， a 为窗口大小排列
 * 
 * [1,2,4,5,6] -> (k:2,a:2) -> [2,4] [5,6]
 * 
 * @param {number[]} nums
 * @param {number} k top k
 * @param {number} a size
 * @returns
 */
export function findMaxSubarrays(nums, k, a) {
    // 定义一个新数组，用于存储每个长度为 a 的子数组的和
    let sums = [];
    // 定义一个变量，用于记录当前子数组的和
    let sum = 0;
    // 遍历数组，计算每个长度为 a 的子数组的和
    for (let i = 0; i < nums.length; i++) {
        // 将当前元素加入子数组的和
        sum += nums[i];
        // 如果子数组的长度达到 a，将和存入新数组，并从和中减去最左边的元素，以便滑动窗口
        if (i >= a - 1) {
            sums.push(sum);
            sum -= nums[i - a + 1];
        }
    }
    // 定义一个结果数组，用于存储前 k 个最大的子数组
    let result = [];
    // 定义一个集合，用于存储已经选择的下标，避免重复
    let set = new Set();
    // 循环 k 次，寻找前 k 个最大的元素
    for (let i = 0; i < k; i++) {
        // 定义一个变量，用于记录当前最大的元素
        let max = -Infinity;
        // 定义一个变量，用于记录当前最大元素的下标
        let index = -1;
        // 遍历新数组，寻找最大的元素和下标
        for (let j = 0; j < sums.length; j++) {
            // 如果当前元素大于最大元素，并且下标没有被选择过，更新最大元素和下标
            if (sums[j] > max && !set.has(j)) {
                // 定义一个标志，用于判断当前子数组是否和已经选择的子数组有重叠
                let overlap = false;
                // 遍历集合，检查是否有重叠的下标
                for (let k of set) {
                    // 如果当前下标和集合中的下标的差值的绝对值小于 a，说明有重叠
                    if (Math.abs(j - k) < a) {
                        overlap = true;
                        break;
                    }
                }
                // 如果没有重叠，更新最大元素和下标
                if (!overlap) {
                    max = sums[j];
                    index = j;
                }
            }
        }
        // 将最大元素的下标加入集合，表示已经选择
        set.add(index);
        // 根据下标在原数组中取出相应的子数组，存入结果数组
        for (let j = 0; j < a; j++) {
            result.push(nums[index + j]);
        }
    }
    // 返回结果数组
    return result;
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
