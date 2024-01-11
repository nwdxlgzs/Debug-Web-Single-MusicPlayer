// 初始化播放器时直接更新播放器需要的所有内容
// 1. 背景图片
// 2. 封面图片
// 3. 歌曲名称
// 4. 艺术家名称
// 5. 音频资源
document.getElementById('blur-background').style.cssText = `
  background: url('./images/background.png') no-repeat center center;
  background-size: cover;
`;
document.getElementById('cover-image').src = "./images/cover.jpg";
document.getElementById('song-title').textContent = "Song: ABC";
document.getElementById('artist-name').textContent = "Artist: 123";
export const SHARE_SINGLE_DOWNLOAD_URL = './resources/sound';