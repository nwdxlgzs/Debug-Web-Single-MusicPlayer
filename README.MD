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
    "animationSTAN": "skew"
}
```
