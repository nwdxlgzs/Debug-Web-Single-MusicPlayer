# Debug-Web-Single-MusicPlayer
一个网页的现代美观带音频可视化的单曲播放器

## 启动：
```
python -m http.server
```

## 更换播放器内容
> 只需要修改`attach.json`内容即可，播放器本身是空壳，通过被动附着`attach.json`挂载的数据实现播放。
```json
{
    "backgroundImage": "./images/background.png",
    "coverImage": "./images/cover.jpg",
    "songTitle": "Heartbeat",
    "artistName": "Cloudier",
    "musicURL": "./resources/sound",
    "mediaType": "audio/mpeg",
    "lrcFile": "./resources/sound_lrc",
    "lrcExistLike": "left",
    "animationSTAN": "skew"
}
```
> 参数说明：

|     参数名      |                                           说明                                            |
| :-------------: | :---------------------------------------------------------------------------------------: |
| backgroundImage |                                         背景图片                                          |
|   coverImage    |                           封面图片（主题色影响周边半透明波浪）                            |
|    songTitle    |                                         歌曲标题                                          |
|   artistName    |                                        艺术家名称                                         |
|    musicURL     |                                       音频文件路径                                        |
|    mediaType    |                             音频文件类型（一般填audio/mpeg）                              |
|     lrcFile     |                                 歌词文件路径（只支持lrc）                                 |
|  lrcExistLike   |                       歌词存在风格（中心center,隐藏hide,靠左left）                        |
|  animationSTAN  | 歌曲标题&艺术家名称文字动画风格（圆周平移circle,无动画none,变长变短skew,左右倾斜stretch） |
