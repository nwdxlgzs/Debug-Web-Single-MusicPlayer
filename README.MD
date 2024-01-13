# Debug-Web-Single-MusicPlayer
一个网页的现代美观带音频可视化的单曲播放器

## 启动：
```
python -m http.server
```

## 更换播放器内容
> 只需要修改`attach.js`内容即可，播放器本身是空壳，通过被动附着`attach.js`挂载的数据实现播放，后期可以通过`attach.js`请求`json`等实现其他更换功能，它不是interface，所以是attach。
```js
document.getElementById('blur-background').style.cssText = `
  background: url('./images/background.png') no-repeat center center;
  background-size: cover;
`;
document.getElementById('cover-image').src = "./images/cover.jpg";
document.getElementById('song-title').textContent = "Song: ABC";
document.getElementById('artist-name').textContent = "Artist: 123";
var SHARE_SINGLE_DOWNLOAD_URL = './resources/sound';
```
| 内容                    | 说明                                                   |
| ----------------------- | ------------------------------------------------------ |
| ./images/background.png | 背景图片（和歌曲有关还是无关无所谓，好看才是第一）     |
| ./images/cover.jpg      | 封面图片（封面图片颜色影响周围透色波纹颜色）           |
| Song: ABC               | 歌曲名称                                               |
| Artist: 123             | 艺术家                                                 |
| ./resources/sound       | 音频地址（流加载，可以加载前加入解密算法播放加密音频） |