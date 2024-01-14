# Debug-Web-Single-MusicPlayer
一个网页的现代美观带音频可视化的单曲播放器

## 启动：
```
python -m http.server
```

## 更换播放器内容
> 只需要修改`attach.json`内容即可，播放器本身是空壳，通过被动附着`attach.json`挂载的数据实现播放。
```js
{
    "backgroundImage": "./images/background.png",
    "coverImage": "./images/cover.jpg",
    "songTitle": "Heartbeat",
    "artistName": "Cloudier",
    "musicURL": "./resources/sound"
}
```
| 内容                    | 说明                                                   |
| ----------------------- | ------------------------------------------------------ |
| ./images/background.png | 背景图片（和歌曲有关还是无关无所谓，好看才是第一）     |
| ./images/cover.jpg      | 封面图片（封面图片颜色影响周围透色波纹颜色）           |
| Song: ABC               | 歌曲名称                                               |
| Artist: 123             | 艺术家                                                 |
| ./resources/sound       | 音频地址（流加载，可以加载前加入解密算法播放加密音频） |