var ffmpeg = require('fluent-ffmpeg');
var path = require('path');
var ffmpegPath = 'D:\\ffmpeg\\ffmpeg-20140901-git-97b8809-win64-static\\bin'

ffmpeg.setFfmpegPath(path.join(ffmpegPath, 'ffmpeg.exe'));
ffmpeg.setFfprobePath(path.join(ffmpegPath, 'ffprobe.exe'));
//var fname = 'D:\\ffmpeg\\ffmpeg-20140901-git-97b8809-win64-static\\bin\\2018-05-14.fail.mp4'
var fname = 'D:\\ffmpeg\\ffmpeg-20140901-git-97b8809-win64-static\\bin\\20180514_ok.mp4'
ffmpeg.ffprobe(fname, function(err,metadata){
    console.log(metadata);
})