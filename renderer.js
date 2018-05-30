// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
var d3 = require('./d3.min.js');
var UIkit = require('./uikit.min.js');
var bar = document.getElementById('js-progressbar');
var ffmpeg = require('fluent-ffmpeg');
var path = require('path');
var ffmpegPath = 'C:\\ffmpeg\\bin';
var fs = require('fs');
const {shell} = require('electron');
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

enableDropOnBody();

function enableDropOnBody(){

    // attach drop event on body

    d3.selection().on('drop', function(){

        d3.event.preventDefault();
        d3.event.stopPropagation();   

        // clear info panels
        var panelArray = [
            d3.select('#beforePanelStream'),
            d3.select('#beforePanelFormat'),
            d3.select('#afterPanelStream'),
            d3.select('#afterPanelFormat'),
        ]
        clearPanelInfo(panelArray);
        //

        // clear video plaryer from attribute and panelBtn
        d3.select('#videoPlayer').attr('from','');
        d3.selectAll('.panelBtn').remove();
        //

        var dt = d3.event.dataTransfer;
        var fileList = dt.files;
        //TODO : 처음부터 1개파일만 drag / drop 할 수 있게는 ?
        if(fileList.length > 1){
            UKalert('1개 파일만 선택해주시기 바랍니다.')
            return false;
        };
        var firstFile = fileList[0];
        var fname = firstFile['name'];
        var fullname = firstFile['path'];

        // set orig div fullname attribute
        d3.select('#orig').attr('fullname',fullname);

        // set title
        d3.select('#title').text(fullname);
        // load video
        d3.select('#videoPlayer').attr('src',fullname);

        // add video tag : from == drop , origLoad or convLoad
        // if "from" attr == drop then getMetaInfo ( new dropped media)
        // else skip getMetaInfo (from panel load btn, so not need to get media info)
        d3.select('#videoPlayer').attr('from','drop');

        // ref : load events
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
}

function disableDropOnBody(){
    d3.selection().on('drop', function(){
        d3.event.preventDefault();
        d3.event.stopPropagation(); 
    });
}

d3.selection().on('dragover', function(e){
    d3.event.preventDefault();
    d3.event.stopPropagation();    
});

d3.select('#videoPlayer').on('loadstart',function(){

    var fullname = d3.select('#videoPlayer').attr('src');
    logger.info('media ready: %s', fullname );
    d3.select('#fileMgr').attr('disabled',null);
    d3.select('#capture').attr('disabled',null);
    d3.select('#upload').attr('disabled',null);

    
    if(d3.select(this).attr('from') === 'drop'){
        showModal('메타정보 추출중...');
        getMeta(fullname,function(streamInfo, formatInfo){        
            hideModal('메타정보 추출완료');
            logger.info(streamInfo);
            logger.info(formatInfo);

            var beforePanelElement = d3.select('#beforePanelStream');
            var beforeformatElement = d3.select('#beforePanelFormat');

            putPanelInfo(beforePanelElement, streamInfo);
            putPanelInfo(beforeformatElement, formatInfo);        

            var origDiv = d3.select('#orig');
            addLoadBtn(origDiv, 'orig');
        })    
    }

})

function getMeta(fname,callback){
    ffmpeg.ffprobe(fname, function(err,metadata){
        if(err){
            logger.error(err);
            return false
        }

        var streamInfo = metadata.streams ? metadata.streams : {'streamInfo':'none',};
        var formatInfo = metadata.format ? metadata.format : {'formatInfo':'none',};
        var streamInfoArray1 = JSON.stringify(streamInfo[0]).split(',');  
        var formatInfoArray = JSON.stringify(formatInfo).split(',');
        if(formatInfo.nb_streams == 2){
            var streamInfoArray2 = JSON.stringify(streamInfo[1]).split(',');
        }
        
        logger.info(streamInfo);
        logger.info(formatInfoArray);

        callback(streamInfoArray1,formatInfoArray);
    })
}

d3.select('#videoPlayer').on('timeupdate', function(){
    //logger.info(d3.event.target.currentTime);
    //logger.info(d3.event.target.duration);
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

d3.select('#fileMgr').on('click', function(){
    var fullname = d3.select('#videoPlayer').attr('src');
    shell.showItemInFolder(fullname);
})

d3.select('upload').on('click', function(){
    
})

d3.select('#capture').on('click', function(){
    logger.info(d3.select('#videoPlayer').property('currentTime'));
    var offset = d3.select('#videoPlayer').property('currentTime')
    var fullname =  d3.select('#videoPlayer').attr('src');
    var outPath = path.dirname(fullname);
    var extn = path.extname(fullname);
    var base = path.basename(fullname,extn);
    var outputFile = path.join(outPath,base) + '_' + offset + '.png';
        
    // 변환시작 -> 기존 progress 정보 삭제
    d3.select('#progressBody').remove();

    // progress HTML 생성
    d3.select('#procModalBody')
    .append('p')
    .attr('id','progressBody')
    .text('image 추출중 ')
    .append('span')
    .attr('id','progress')


    var command = ffmpeg(fullname)
    .inputOptions(['-ss ' + offset])
    .outputOptions(['-vframes 1'])
    .on('start', function(commandLine) {
        logger.info('Spawned Ffmpeg with command: ' + commandLine);   
        UIkit.modal('#procModal').show();        
    })
    .on('progress', function(progress) {
        logger.info('Processing: ' + progress.percent + '% done');
    })
    .on('stderr', function(stderrLine) {
        logger.info('Stderr output: ' + stderrLine);
    })
    .on('error', function(err, stdout, stderr) {
        logger.error('Cannot process video: ' + err.message);
        fs.unlink(outputFile,function(err){
            if(err) logger.error(err);
            logger.info('file delete success! : %s', outputFile);
        })
        UIkit.modal('#procModal').hide();
    })
    .on('end', function(stdout, stderr) {
        logger.info('capture image succeeded !');
        UIkit.modal('#procModal').hide();
        //UIkit.modal('#modalProgress').hide();
    })
    .output(outputFile)
    .run();

})

d3.select("#convert").on('click',function(){

    // 변환시작 -> 기존 progress 정보 삭제
    d3.select('#progressBody').remove();

    // progress HTML 생성
    d3.select('#procModalBody')
    .append('p')
    .attr('id','progressBody')
    .text('Convert Processing ')
    .append('span')
    .attr('id','progress')

    // progress HTML에 cancel button 추가
    d3.select('#procModalBody')
    .select('p')     
    .append('span')
    .append('button')
    .attr('id','cancel')
    .classed('uk-button',true)
    .classed('uk-button-small',true)
    .classed('uk-button-primary',true)
    .classed('uk-position-center-right',true)
    .classed('uk-position-medium', true)
    .text('변환취소')
   
    // output 파일 postfix를 위한 현재 timestamp 구하기
    var now = new Date();

    // output 파일 fullname 설정
    var origFname = d3.select('#videoPlayer').attr('src');
    if(!origFname){
        UKalert('먼저 소스 영상을 drag & drop 하시기 바랍니다.')
        logger.error('변환 대상 파일 없음!')
        return false;
    }
    var origPath = path.dirname(origFname);
    var origExtn = path.extname(origFname);
    var origBase = path.basename(origFname,origExtn);
    var convBase = origBase + '_' + now.getTime();
    var convFname = path.join(origPath,convBase) + origExtn;
    //

    logger.info('convert start : %s', origFname);
    
    var command = ffmpeg(origFname)
        .videoCodec('libx264')
        .on('start', function(commandLine) {
            UIkit.modal('#procModal').show();
            disableDropOnBody();
            logger.info('Spawned Ffmpeg with command: ' + commandLine);
            d3.select('button.load-conv').remove();
            d3.select('#afterPanelStream').text('변환후 Video 정보');
            d3.select('#afterPanelFormat').text('변환후 Format 정보')
            d3.select('#cancel').on('click', function(){
                d3.select('#modalProgress').text('취소중..');
                command.kill();
            })
        })
        .on('progress', function(progress) {
            logger.info('Processing: ' + progress.percent + '% done');
            d3.select('#progress').text(' : ' + progress.percent.toFixed(2) + '% ');
        })
        .on('stderr', function(stderrLine) {
            logger.info('Stderr output: ' + stderrLine);
        })
        .on('error', function(err, stdout, stderr) {
            logger.error('Cannot process video: ' + err.message);
            UIkit.modal('#procModal').hide();
            fs.unlink(convFname,function(err){
                if(err) logger.error(err);
                logger.info('file delete success! : %s', convFname);
            })
            enableDropOnBody();
        })
        .on('end', function(stdout, stderr) {
            logger.info('Transcoding succeeded !');
            //UIkit.modal('#modalProgress').hide();
            UIkit.modal('#procModal').hide();
            getMeta(convFname,function(streamInfo, formatInfo){              
                var beforePanelElement = d3.select('#afterPanelStream');
                var beforeformatElement = d3.select('#afterPanelFormat');
        
                putPanelInfo(beforePanelElement, streamInfo);
                putPanelInfo(beforeformatElement, formatInfo);

                var convDiv = d3.select('#conv');
                convDiv.attr('fullname',convFname);
                addLoadBtn(convDiv,'conv');
            })   
            enableDropOnBody();  
        })
        .save(convFname);
});

function addLoadBtn(ele, from){

    // load-orig, load-conv
    var btnClass = 'load-' + from;
    ele.append('button')
    .classed('uk-button',true)
    .classed('uk-button-primary',true)
    .classed('uk-width-1-1',true)
    .classed('panelBtn', true)
    .classed(btnClass,true)
    .text('Load')
    .on('click',function(){
        var fullname = ele.attr('fullname');
        // set title
        d3.select('#title').text(fullname);
        // load video
        d3.select('#videoPlayer').attr('src',fullname);    
        d3.select('#videoPlayer').attr('from',from);    
    })
}

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
    console.log('height : ' + msgPanel.property('scrollHeight'));
    d3.select('#msgPanel').property('scrollTop', msgPanel.property('scrollHeight'));
    //msgPanel.scrollTop = msgPanel.scrollHeight;

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

logger.info('loading done!')