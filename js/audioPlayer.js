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

    constructor() {
    }

    /**
     *
     * @param {string | null} src
     */
    create(src = null) {
        const AudioContext = window.AudioContext;
        this.audioContext = new AudioContext();

        this.mediaSource = new MediaSource();
        this.analyser = this.audioContext.createAnalyser();


        this.analyser.minDecibels = -90;
        this.analyser.maxDecibels = -10;
        this.analyser.smoothingTimeConstant = 0;
        this.analyser.fftSize = AUDIO_FFTSIZE;


        this.audio = new Audio();
        this.audio.src = src ?? URL.createObjectURL(this.mediaSource);

        const sourceNode = this.audioContext.createMediaElementSource(this.audio);
        sourceNode.connect(this.analyser);

        this.analyser.connect(this.audioContext.destination);

        this.init = true;

        this.audio.addEventListener('durationchange', () => {
            if (this.audio.duration !== Infinity) {
                this.audio.onloadedmetadata();
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
                const response = await fetch('./resources/sound.mp3');

                const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg'); // 音频格式需要与文件类型匹配

                const reader = response.body.getReader();
                const pump = async () => {
                    const {done, value} = await reader.read();
                    if (done) {
                        mediaSource.endOfStream();


                        // audio.play(); // 当音频数据加载完毕后播放
                        return;
                    }

                    sourceBuffer.appendBuffer(value); // 将数据块添加到sourceBuffer

                    await new Promise(
                        (resolve) => (sourceBuffer.onupdateend = resolve)
                    );
                    pump();
                };

                pump();
            } catch (e) {
                console.error('Error fetching audio', e);
            }
        }
    }

    /**
     * @param {number} duration

     */
    set currentTime(duration) {
        this.audio.currentTime = duration;
    }

    /**
     * @param {number} volume

     */
    set volume(volume) {
        this.audio.volume = volume;
    }

    get duration() {
        return this.audio.duration;
    }

    // 暂停音频
    pause() {
        this.analyser.disconnect();
        this.audio.pause();
    }

    play() {

        this.audio.play();

    }
}

export const AUDIO_FFTSIZE = 2048;

export default AudioPlayer;
