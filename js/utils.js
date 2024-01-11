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
