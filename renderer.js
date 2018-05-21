// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
var d3 = require('./d3.min.js');
var UIkit = require('./uikit.min.js');
var bar = document.getElementById('js-progressbar');
var ffmpeg = require('fluent-ffmpeg');
var path = require('path');
var ffmpegPath = 'C:\\ffmpeg\\bin'
ffmpeg.setFfmpegPath(path.join(ffmpegPath, 'ffmpeg.exe'));
ffmpeg.setFfprobePath(path.join(ffmpegPath, 'ffprobe.exe'));

/* camera rendering
var errorCallback = function(e) {
    console.log('Reeeejected!', e);
  };

  // Not showing vendor prefixes.
  navigator.getUserMedia({video: true, audio: true}, function(localMediaStream) {
    var video = document.querySelector('video');
    video.src = window.URL.createObjectURL(localMediaStream);

    // Note: onloadedmetadata doesn't fire in Chrome when using it with getUserMedia.
    // See crbug.com/110938.
    video.onloadedmetadata = function(e) {
      // Ready to go. Do some stuff.
    };
  }, errorCallback);
*/



d3.selection().on('drop', function(){
    d3.event.preventDefault();
    d3.event.stopPropagation();   
    var dt = d3.event.dataTransfer;
    var fileList = dt.files;
    var firstFile = fileList[0];
    d3.select('#title').text(firstFile['name']);
    d3.select('#videoPlayer').attr('src',firstFile['path']);
});

d3.selection().on('dragover', function(e){
    d3.event.preventDefault();
    d3.event.stopPropagation();    
});

d3.select('#videoPlayer').on('error',function(){
    var errCode = d3.event.target.error.code;
    var errMsg = d3.event.target.error.message;
    var userMsg = '<span class="uk-text-small">video loading error : code = ' + errCode + ' , msg = ' + errMsg + '</span>'; 
    // error code ref : https://developer.mozilla.org/ko/docs/Web/API/MediaError
    console.log(userMsg);
    UIkit.notification({
        message : userMsg,
        status : 'primary',
        pos : 'bottom-left',
        timeout : 5000
    })
})