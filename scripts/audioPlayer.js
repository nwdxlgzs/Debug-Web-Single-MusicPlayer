/**
 * 音乐播放类
 */
class AudioPlayer {
    /**
     * @type {MediaSource}
     */
    mediaSource; // 媒体资源

    /**
     * @type {HTMLAudioElement}
     */
    audio; // 音频元素

    /**
     * @type {AudioContext}
     */
    audioContext; // 音频上下

    /**
     * @type {AnalyserNode}
     */
    analyser;

    /**
     * @type {boolean} src
     */
    init = false;

    constructor() { }

    /**
     *
     * @param {string | null} src
     */
    create(src = null) {
        this.mediaSource = new MediaSource();
        this.audio = new Audio();
        if (this.pre_volume != null && this.pre_volume != undefined) {
            this.audio.volume = this.pre_volume;
            this.pre_volume = null;
        }
        this.audio.src = src ?? URL.createObjectURL(this.mediaSource);

        this.audio.addEventListener('durationchange', () => {
            if (this.audio.duration !== Infinity) {
                this.audio.onloadedmetadata();
                if (this.pre_currentTime != null && this.pre_currentTime != undefined) {
                    this.audio.currentTime = this.audio.duration * (this.pre_currentTime / 100);
                    this.pre_currentTime = null;
                }
            }
        });

        this.#loadMusic();
    }

    #loadMusic() {
        const mediaSource = this.mediaSource;

        mediaSource.addEventListener('sourceopen', sourceOpen);
        async function sourceOpen() {
            try {
                // 获取音乐文件的响应流
                const response = await fetch(window.attach.SHARE_SINGLE_DOWNLOAD_URL);
                const originalResponseArrayBuffer = response.arrayBuffer;
                const sourceBuffer = mediaSource.addSourceBuffer(window.attach.MEDIA_SOURCE_BUFFER_TYPE); // 音频格式需要与文件类型匹配
                const originalSourceBufferAppendBuffer = sourceBuffer.appendBuffer;
                sourceBuffer.onupdateend = function () {
                    mediaSource.endOfStream();
                }
                if (!Function.prototype.toString.call(window.Response.prototype.arrayBuffer).includes("[native code]") ||
                    !Function.prototype.toString.call(response.arrayBuffer).includes("[native code]") ||
                    !Function.prototype.toString.call(window.SourceBuffer.prototype.appendBuffer).includes("[native code]") ||
                    !Function.prototype.toString.call(sourceBuffer.appendBuffer).includes("[native code]") ||
                    !Function.prototype.toString.call(window.crypto.subtle.decrypt).includes("[native code]") ||
                    Response.prototype.arrayBuffer !== originalResponseArrayBuffer ||
                    SourceBuffer.prototype.appendBuffer !== originalSourceBufferAppendBuffer) {
                    return;
                }
                const BUFFER = new Uint8Array(await response.arrayBuffer());
                // 使用解密算法
                await window.attach.decrypt(BUFFER);
                sourceBuffer.appendBuffer(BUFFER);
            } catch (e) {
                console.error('Error fetching audio', e);
            }
        }
    }

    /**
     * @param {number} duration

     */
    set currentTime(duration) {
        if (isNaN(duration)) {
            // console.warn('Invalid duration', duration);
            return;
        }
        if (this.audio == undefined || this.audio == null) {
            this.pre_currentTime = -duration;//duration是负数，见get duration()
            return;
        }
        this.audio.currentTime = duration;
    }

    get currentTime() {
        return this.audio.currentTime;
    }

    /**
     * @param {number} volume

     */
    set volume(volume) {
        if (isNaN(volume)) {
            // console.warn('Invalid volume', duration);
            return;
        }
        if (this.audio == undefined || this.audio == null) {
            this.pre_volume = volume;
            return;
        }
        this.audio.volume = volume;
    }

    get volume() {
        if (this.audio == undefined || this.audio == null) {
            return this.pre_volume;
        }
        return this.audio.volume;
    }

    set duration(duration) {
        this.audio.duration = duration;
    }

    get duration() {
        if (this.audio == undefined || this.audio == null) {
            return -100;//负数duration方便保留百分比(player.currentTime = player.duration * (progress / 100);)
        }
        return this.audio.duration;
    }

    get paused() {
        return this.audio.paused;
    }

    // 暂停音频
    pause() {
        this.analyser.disconnect();
        this.audio.pause();
    }

    play() {
        if (!this.init) {
            const AudioContext = window.AudioContext;

            this.audioContext = new AudioContext();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.minDecibels = -90;
            this.analyser.maxDecibels = -10;
            this.analyser.smoothingTimeConstant = 0.5;
            this.analyser.fftSize = AUDIO_FFTSIZE;
            const sourceNode = this.audioContext.createMediaElementSource(
                this.audio
            );
            sourceNode.connect(this.analyser);

            this.analyser.connect(this.audioContext.destination);
            this.init = true;
        }
        this.analyser.connect(this.audioContext.destination);
        this.audio.play();

    }
}

export const AUDIO_FFTSIZE = 1024;

export default AudioPlayer;
