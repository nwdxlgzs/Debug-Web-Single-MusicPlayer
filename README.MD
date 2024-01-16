# Debug-Web-Single-MusicPlayer
一个网页的现代美观带音频可视化的单曲播放器

## 启动：
```
python -m http.server
```

## Pull requests说明
> 这个播放器计划只支持播放单曲，相关API也是奔着单曲做的（以及带解密预留的懒加载设计等），如果对这些有修改想法，请等这个项目完成后，开的新的基于此项目的后续版本进行Pr.

## 更换播放器内容
> 只需要修改`attach.json`内容即可，播放器本身是空壳，通过被动附着`attach.json`挂载的数据实现播放。
```json
{
    "backgroundImage": "./resources/Lulleaux-Empty Love-background.png",
    "coverImage": "./resources/Lulleaux-Empty Love-cover.jpg",
    "songTitle": "Empty Love💗",
    "artistName": "Lulleaux",
    "musicURL": "./resources/Lulleaux-Empty Love.mp3",
    "mediaType": "audio/mpeg",
    "lrcFile": "./resources/Lulleaux-Empty Love.lrc",
    "lrcExistLike": "left",
    "animationSTAN": "stretch",
    "BGfilterBlurPx": 0
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
| BGfilterBlurPx  |                                 背景图片进行模糊时的px值                                  |


## Contributors
| 贡献者                                                       | 贡献内容        |
| ------------------------------------------------------------ | --------------- |
| ![nwdxlgzs](https://github.com/nwdxlgzs.png?size=50)         | 项目实际维护    |
| ![Jesse205](https://github.com/Jesse205.png?size=50)         | BUG修复、UI修正 |
| ![dingyi222666](https://github.com/dingyi222666.png?size=50) | 项目重构        |
