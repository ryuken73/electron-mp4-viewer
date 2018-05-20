var ffmpeg = require('fluent-ffmpeg');
var path = require('path');
var ffmpegPath = 'C:\\ffmpeg\\bin'

ffmpeg.setFfmpegPath(path.join(ffmpegPath, 'ffmpeg.exe'));
ffmpeg.setFfprobePath(path.join(ffmpegPath, 'ffprobe.exe'));
var fname = 'C:\\Users\\건우\\Documents\\나미야잡화점.mp4'

ffmpeg.ffprobe(fname, function(err,metadata){
    console.log(metadata);
})