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
var url = require('url');
var levelup = require('levelup');
var leveldown = require('leveldown');
var thumb = require('node-thumbnail').thumb;
var ftp = require('ftp');
const {shell} = require('electron');
const {BrowserWindow} = require('electron');
var {remote} = require('electron');

var WOWZAURL = 'hdretv.sbs.co.kr:1935/STREAM/_definst_/mp4:/SBSNOW/';


ffmpeg.setFfmpegPath(path.join(ffmpegPath, 'ffmpeg.exe'));
ffmpeg.setFfprobePath(path.join(ffmpegPath, 'ffprobe.exe'));

var db = levelup(leveldown('mp4db'));

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

// converting 중 drop을 막고
// convert가 끝나면 drop을 푸는 코드

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

//

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
    var from = d3.select(this).attr('from');
    /*
    var btnClass;
    if(from === 'drop'){        
        btnClass = '.load-orig';
    } else {
        btnClass = '.load-conv';
    }
    UIkit.icon(btnClass,{'icon': 'check'});
    */
    
    if(from === 'drop'){
        showModal('메타정보 추출중...');
        getMeta(fullname,function(err, streamInfo, formatInfo){        
            hideModal('메타정보 추출완료');
            logger.info(streamInfo);
            logger.info(formatInfo);

            var beforePanelElement = d3.select('#beforePanelStream');
            var beforeformatElement = d3.select('#beforePanelFormat');

            putPanelInfo(beforePanelElement, streamInfo);
            putPanelInfo(beforeformatElement, formatInfo);        

            var origDiv = d3.select('#orig');
            addLoadBtn(origDiv, 'orig');
            d3.select('.load-orig').dispatch('click');
        })    
    }

})

function getMeta(fname,callback){
    ffmpeg.ffprobe(fname, function(err,metadata){
        if(err){
            logger.error(err);
            
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

        callback(null, streamInfoArray1,formatInfoArray);
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

d3.select('#title').on('click', function(){
    var fullname = d3.select('#videoPlayer').attr('src');
    shell.showItemInFolder(fullname);
})

d3.select('#upload').on('click', function(){
    logger.info('upload start!')

    //upload 시작 -> 기존 progress 정보 삭제
    d3.select('#progressBody').remove();

    // progress HTML 생성
    d3.select('#procModalBody')
    .append('p')
    .attr('id','progressBody')
    .text('ftp transfer Processed ')
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
    .text('전송취소')
    // UI end

    var connectionOpts = {};    
    connectionOpts.host = d3.select('#ip').property('value');
    connectionOpts.user = d3.select('#id').property('value');
    connectionOpts.password = d3.select('#pwd').property('value');
    logger.info('ftp connection info : %j', connectionOpts);

    var now = new Date();
    var fullname = d3.select('#videoPlayer').attr('src');
    var extname = path.extname(fullname);
    var basename = path.basename(fullname,extname);
    var targetDir = d3.select('#path').property('value')
    var targetname = basename + '_' + now.getTime() + extname;
    var targetFullname = path.posix.join(targetDir,targetname);
    logger.info("save %s to %s",fullname,targetFullname);

    var c = new ftp();
    c.on('ready',function(){

        UIkit.modal('#procModal').show();
        d3.select('#cancel').on('click', function(){
            logger.info('전송취소... %s',fullname);
            d3.select('#modalProgress').text('취소중..');
            /*
            c.destroy(function(){
                logger.info('ftp connection destroyed');
                readStream.destroy();
                  //UIkit.modal('#procModal').hide();
            })
            */
            c.abort(function(err){
                logger.info('connection aborted');
                logger.error(err);
            })
            readStream.destroy();
            UIkit.modal('#procModal').hide();
        })


        var readStream = fs.createReadStream(fullname);
        var progressed = 0;
        var total = fs.statSync(fullname).size;

        readStream.on('data',function(d){
            progressed += d.length;
            var percent = (progressed/total*100).toFixed(1) + '% complete';
            //logger.info(percent);
            d3.select('#progress').text(' : ' + percent);
        })

        readStream.on('error',function(err){
            logger.error(err);
            UKalert(err);
        })

        c.cwd(targetDir, function(err,pathname){
            if(err){
                logger.error(err);
                UKalert(err);
            } else {
                c.put(readStream, targetname, function(err){
                    if(err){
                        logger.error(err);
                        UKalert(err);
                        UIkit.modal('#procModal').hide();
                    }else{
                        logger.info('ftp upload success : %s', targetname);
                        c.end()
                        UIkit.modal('#procModal').hide();
                        UKalert('stream url : ' + WOWZAURL + targetname);
                    }
                })
            }
        })

    })  
    c.on('error', function(err){
        logger.error(err);
    })  
    c.connect(connectionOpts)
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
    .text('extracting image...')
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
        var thumbSuffix = '_thumb';
        logger.info('capture image succeeded !');
        var options = {
            'source' : outputFile,
            'destination' : path.dirname(outputFile),
            'suffix' : thumbSuffix,
            'width' : 100,
            'logger' : function(message){
                logger.info(message);
            }
        }
        thumb(options)
        .then(function(){
            var thumbPath = path.dirname(outputFile);
            var extn = path.extname(outputFile);
            var baseFname = path.basename(outputFile,extn);
            var thumbnail = path.join(thumbPath,baseFname) + thumbSuffix + extn;
            d3.select('ul.uk-thumbnav')
            .append('li')
            .append('a')
            .attr('href',outputFile)
            //.text('image')
            .append('img')
            .attr('src', thumbnail);
        })
        .then(null,function(err){
            logger.error(err);
            UKalert(err);
        })

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
    .text('Converting Processed ')
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
            getMeta(convFname,function(err, streamInfo, formatInfo){              
                var beforePanelElement = d3.select('#afterPanelStream');
                var beforeformatElement = d3.select('#afterPanelFormat');
        
                putPanelInfo(beforePanelElement, streamInfo);
                putPanelInfo(beforeformatElement, formatInfo);

                var convDiv = d3.select('#conv');
                convDiv.attr('fullname',convFname);
                addLoadBtn(convDiv,'conv');
                d3.select('.load-conv').dispatch('click');
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
        // change active button color and text
        var origBtnClass = 'load-orig';
        var convBtnClass = 'load-conv';
        d3.select(this)
        .classed('uk-button-primary',false)
        .classed('uk-button-secondary',true)
        .text('Loaded');
        
        var prevBtnClass = btnClass == origBtnClass ? convBtnClass : origBtnClass;
        d3.select('.' + prevBtnClass)
        .classed('uk-button-secondary',false)
        .classed('uk-button-primary',true)
        .text('Load');       
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

logger.info('loading done1!')
logger.info(process.versions)
// ftp server config + click event handler

// select ftp server info and make row
selectAllData(function(serverInfos){
    serverInfos.map(function(server){
        logger.info(server);
        addNewRow('#serverList', server, function(){
            if(server.checked){
                d3.select('div#current').selectAll('div')
                .select('input')
                .select(function(d,i,n){
                    var key = d3.select(this).attr('id');
                    d3.select(this).property('value', server[key])
                })
            }
            logger.info('server list load done!');
        });
    })
})

d3.select('#ftpConfig').on('click',function(){
    var config = d3.select('#serverConfig')
    var hidden = config.classed('uk-hidden');
    logger.info(hidden);

    if(hidden){
        d3.select(this).text(' - ');
        config.classed('uk-hidden',false);
        config.classed('uk-visible',true);
    } else {
        d3.select(this).text(' + ');
        config.classed('uk-visible',false);
        config.classed('uk-hidden',true);
    }
})

function selectAllData(callback){

    // run callback with parameter server info object
    // { servername:, ip:, id:, pwd:, path:}

    var result = [];

    db.createReadStream()
    .on('data', function (buf) {
        var serverInfo = JSON.parse(buf.value.toString());
        serverInfo.servername = buf.key.toString();
        result.push(serverInfo)
      //logger.info(data.key, '=', data.value);
      //callback(data);
    })
    .on('error', function (err) {
      logger.error(err)
    })
    .on('close', function () {
      logger.info('Stream closed')
    })
    .on('end', function () {
      logger.info('Stream ended')
      callback(result);
    })
}

// ftp server pannel server add click event handler
d3.select('#addServer').on('click',function(){
    addNewRow('#serverList', null, function(){
        var serverPannel = d3.select('#serverList');
        serverPannel.property('scrollTop', serverPannel.property('scrollHeight'));
    });
})

function addNewRow(selector, data, callback){

    logger.info(data)

    var newRow = d3.select(selector)
    .append('div')

    newRow
    .classed('uk-grid',true)
    .classed('uk-grid-small',true)
    //.classed('uk-child-width-expand',true)
    .classed('uk-child-width-auto',true)
    .classed('uk-margin-small',true)
    .classed('serverInfo',true)
    .attr('uk-grid','')

    newRow
    .append('div')
    .append('input')
    .classed('uk-radio',true)
    .attr('type','radio')
    .attr('name','selectRadio')
    .property('checked', function(){
        return data ? data.checked : false
    })
    .on('click',function(){
        var parent = d3.select(this.parentNode);
        parent.select(function(d,i,n){
            var row = d3.select(this.parentNode)
            row.selectAll('div').selectAll('input')
            .each(function(d,i,n){
                var colname = d3.select(this).attr('column');
                var value = d3.select(this).property('value');
                d3.select('div#current').selectAll('div')
                .each(function(d,i,n){
                    var id = '#' + colname;
                    d3.select('input' + id).property('value', value);
                })
            })
        })
    })

    newRow
    .append('div')
    .append('input')
    .classed('uk-input',true)
    .classed('uk-form-small',true)
    .attr('column','servername')
    .attr('placeholder','Server Name')
    .property('value',function(){
        return data ? data.servername : ''
    })

    newRow
    .append('div')
    .append('input')
    .classed('uk-input',true)
    .classed('uk-form-small',true)
    .attr('column','ip')
    .attr('placeholder','IP')
    .property('value',function(){
        return data ? data.ip : ''
    })


    newRow
    .append('div')
    .append('input')
    .classed('uk-input',true)
    .classed('uk-form-small',true)
    .attr('column','id')
    .attr('placeholder','ID')
    .property('value',function(){
        return data ? data.id : ''
    })

    newRow
    .append('div')
    .append('input')
    .classed('uk-input',true)
    .classed('uk-form-small',true)
    .classed('uk-width-1-8',true)
    .attr('type','password')
    .attr('column','pwd')
    .attr('placeholder','PASSWORD')
    .property('value',function(){
        return data ? data.pwd : ''
    })

    newRow
    .append('div')
    .append('input')
    .classed('uk-input',true)
    .classed('uk-form-small',true)
    .attr('column','path')
    .attr('placeholder','PATH')
    .property('value',function(){
        return data ? data.path : ''
    })

    newRow
    .append('div')
    .append('button')
    .classed('uk-button',true)
    .classed('uk-button-danger',true)
    .classed('uk-button-small',true)
    .attr('id','delServer')
    .text('DEL')
    .on('click',function(){
        newRow.remove();
    })

    callback(newRow);
}

d3.select('#saveConfig').on('click',function(){
    logger.info('saveConfig clicked');
    // initialize(clear) database
    selectAllData(function(serverInfos){
        var processed = 0;

        if(serverInfos.length != 0){
            serverInfos.map(function(server){
                logger.info('delete : %j', server);
                var key = server.servername;
                db.del(key,function(err){
                    if(err) logger.error(err);
                    logger.info('db cleare success!')
                    processed += 1;
                    if(processed == serverInfos.length){
                        var serverConfigs = readRows();
                        insertRows(serverConfigs);
                    }
                })
            })
        } else {
            var serverConfigs = readRows();
            insertRows(serverConfigs);
        }


    })
})

function readRows(){
    // @ leveldb record shape
    // key = serverName
    // value = {ip:-, id:-, pwd:-, path:-}
    var serverConfigs = [];
    var index;

    d3.selectAll('.serverInfo')
    .select(function(d,i,n){
        logger.info('.serverInfo : %d', i)
        d3.select(this)
        .selectAll('div')
        .selectAll('input')
        .select(function(d,i,n){
            if(d3.select(this).classed('uk-radio')){
                // this is first column
                // initialize server in serverInfos
                var checked = d3.select(this).property('checked')
                serverConfigs.push({'checked':checked});
                index = serverConfigs.length - 1;
            } else {            
                // add connection info on n'th server object  
                var colname = d3.select(this).attr('column');
                var value = d3.select(this).property('value');
                serverConfigs[index][colname] = value;
            }
        })   
    })

    logger.info(serverConfigs);

    return serverConfigs;
}

function insertRows(serverConfigs){
    
    logger.info('save serverinfo : %j',serverConfigs);
    serverConfigs.map(function(server){
        var k = server.servername;
        var v = {
            ip : server.ip,
            id : server.id,
            pwd : server.pwd,
            path : server.path,
            checked : server.checked
        }
        var vString = JSON.stringify(v)
        db.put(k,vString,function(err){
            if(err) {
                logger.error(err);
            } else {
                logger.info('save success! : %j', server)
            }
        })
        
    })
}

/*
// make modal windows
// too slow
d3.select('#ftpConfig').on('click',function(){
    var configHTML = path.join(__dirname,"config.html");
    var top = remote.getCurrentWindow();
    console.log(top)
    var winOpts = {
        parent : remote.getCurrentWindow(),
        width: 1024, 
        height: 768,
        modal : true,
        show : false,
        frame : true
    }
    let child = new remote.BrowserWindow(winOpts);
    child.on('close', function(){
        child = null;
    });
    child.loadURL(url.format({
        pathname: configHTML,
        protocol: 'file:',
        slashes: true
    }));
    child.once('ready-to-show',function(){
        child.show();
    })
})
*/