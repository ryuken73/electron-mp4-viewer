# Simple Media Converter Using Electron

**Can download prebuilt binary for Windows from here And Test**

This is a simple Electron Application to handling single Media file (play,convert,capture,upload) 

**If you need to convert various media format to standard h.264, this can be helpful!**

Use below modules

- `UIKit` - UI framework
- `ffmpeg-fluent.js` - media format info extraction and conversion
- `node-thumbnail` - make thumbnail
- `node-ftp` - upload media to ftp server

## To Use

1. Install
```bash
# Clone this repository
git clone https://github.com/ryuken73/electron-mp4-viewer.git
# Install dependencies
npm install
# Run the app
npm start
```
2. Load Media
- Just Drag and Drop Media
- Then ffprobe extract media info and load video player
- Only html5 vedio tag compatible media can be loaded

3. Convert Media
- Click Convert Button
- Select media type (type can be any format supported by ffmpeg)
![Alt Text](https://github.com/ryuken73/electron-mp4-viewer/blob/master/images/converting.jpg)

4. Capture Scene
- Click Capture Button
- Can be captured during playing and paused state
- Can preview thumbnail and navigate using UIkit thumbnav
- Captured images and thumbnails are saved same directory media exists
![Alt Text](https://github.com/ryuken73/electron-mp4-viewer/blob/master/images/capture.jpg)
  
5. Register FTP Server Info
- Click Server Name + 
- Click Add Button and write ftp connection info
- Click Save Button to save ftp connection informations to chromium localStorage
![Alt Text](https://github.com/ryuken73/electron-mp4-viewer/blob/master/images/ftpconfig.jpg)

6. Upload Media
- Select Server from Server Configuration Pannel
- Click Upload Button

## License

[CC0 1.0 (Public Domain)](LICENSE.md)
