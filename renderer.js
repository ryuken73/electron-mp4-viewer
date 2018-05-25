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

var tracer = require('tracer');
var logLevel = 'trace';
var logger = tracer.console(
			{
				format : "{{timestamp}} [{{title}}][{{method}}] {{message}} (in {{file}}:{{line}})",	
				dateformat: 'yyyy-mm-dd HH:MM:ss',
				level:logLevel,
				transport : [
                    /*
					function(data){
						fs.appendFile(logFile, data.output + '\n', function(err){
							if(err) {
								throw err;
							}
						});
                    },
                    */
					function(data){
						console.log(data.output);
                    },
                    function(data){
                        UKlogger(data.output);
                    }
                    /*,
					function(data){
						mailNotification('error', data);
                    }
                    */				
				]
			}
); 


d3.selection().on('drop', function(){
    d3.event.preventDefault();
    d3.event.stopPropagation();   

    var panelArray = [
        d3.select('#beforePanelStream'),
        d3.select('#beforePanelFormat'),
        d3.select('#afterPanelStream'),
        d3.select('#afterPanelFormat'),
    ]

    clearPanelInfo(panelArray);

    var dt = d3.event.dataTransfer;
    var fileList = dt.files;
    //TODO : 처음부터 1개파일만 drag / drop 할 수 있게는 ?
    if(fileList.length > 1){
        UKalert('1개 파일만 선택해주시기 바랍니다.')
        return false;
    };
    var firstFile = fileList[0];
    // set title
    d3.select('#title').text(firstFile['name']);
    // load video
    d3.select('#videoPlayer').attr('src',firstFile['path']);
    // load events
    /*
    loadstart
    durationchange
    loadedmetadata
    loadeddata
    progress
    canplay
    canplaythrough
    */
});

d3.selection().on('dragover', function(e){
    d3.event.preventDefault();
    d3.event.stopPropagation();    
});

d3.select('#videoPlayer').on('loadstart',function(){

    var fname = d3.select('#videoPlayer').attr('src');
    logger.info('media ready: %s', fname );
    showModal('메타정보 추출중...');
    ffmpeg.ffprobe(fname, function(err,metadata){
        if(err){
            logger.error(err);
            return false
        }
        hideModal('메타정보 추출완료');
        var streamInfo = metadata.streams;
        var formatInfo = metadata.format;
        var streamInfoArray1 = JSON.stringify(streamInfo[0]).split(',');
        var streamInfoArray2 = JSON.stringify(streamInfo[1]).split(',');
        var formatInfoArray = JSON.stringify(formatInfo).split(',');
        logger.info(streamInfo);
        logger.info(formatInfoArray);

        var beforePanelElement = d3.select('#beforePanelStream');
        var beforeformatElement = d3.select('#beforePanelFormat');

        putPanelInfo(beforePanelElement, streamInfoArray1);
        putPanelInfo(beforeformatElement, formatInfoArray);

    })
})

d3.select('#videoPlayer').on('error',function(){
    var errCode = d3.event.target.error.code;
    var errMsg = d3.event.target.error.message;
    //var userMsg = '<span class="uk-text-small">오류 : video loading error : code = ' + errCode + ' , msg = ' + errMsg + '</span>'; 
    var userMsg = '오류 : video loading error : code = ' + errCode + ' , msg = ' + errMsg ;
    // error code ref : https://developer.mozilla.org/ko/docs/Web/API/MediaError
    console.log(userMsg);
    UKalert(userMsg);

    /*
    UIkit.notification({
        message : userMsg,
        status : 'primary',
        pos : 'bottom-left',
        timeout : 5000
    })
    */
})


d3.select("#convert").on('click',function(){
    console.log('clicked');
    logger('clicked');
});

function clearPanelInfo(elementArray){
    elementArray.forEach(function(ele){
        ele.selectAll('div').remove();
    });
}

function putPanelInfo(ele, content){
    ele.selectAll('div')
    .data(content)
    .enter()
    .append('div')
    .text(function(d){
        return d.replace('{','').replace('}','')
    })
}

function UKlogger(msg){
    d3.select('#msgPanel')
    .append('div')
    .text(msg)

    var msgPanel = d3.select('#msgPanel');
    msgPanel.scrollTop = msgPanel.scrollHeight;

}

function UKalert(msg){
    var modalDiv = d3.select('#errorMsg');
    modalDiv.text(msg);
    UIkit.modal('#errorModal').show();
}

// 발급요청중

function showModal(msg){
    var modalDiv = d3.select('#errorMsg');
    modalDiv.text('');
    modalDiv.text(msg);
    //modalDiv.append('h2').text('발급요청중....')
    UIkit.modal('#errorModal').show();
}

// 발급완료

function hideModal(msg){
    var modalDiv = d3.select('#errorMsg');
    modalDiv.text('');
    modalDiv.text(msg);
    setTimeout(function(){
        UIkit.modal('#errorModal').hide();
    },1000)
}