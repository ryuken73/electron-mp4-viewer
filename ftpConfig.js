var d3 = require('./d3.min.js');
var UIkit = require('./uikit.min.js');
var path = require('path');

var levelup = require('levelup');
var leveldown = require('leveldown');


var database = levelup(leveldown('mydb'));

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


d3.select('#addServer').on('click',function(){

    var newRow = d3.select('#serverList')
    .append('div')

    newRow
    .classed('uk-grid',true)
    .classed('uk-child-width-expand',true)
    .classed('uk-margin-small',true)
    .classed('serverInfo',true)
    .attr('uk-grid','')

    newRow
    .append('div')
    .append('input')
    .classed('uk-input',true)

    newRow
    .append('div')
    .append('input')
    .classed('uk-input',true)

    newRow
    .append('div')
    .append('input')
    .classed('uk-input',true)

    newRow
    .append('div')
    .append('input')
    .classed('uk-input',true)

    newRow
    .append('div')
    .append('input')
    .classed('uk-input',true)

    newRow
    .append('div')
    .append('button')
    .classed('uk-button',true)
    .classed('uk-button-danger',true)
    .attr('id','delServer')
    .text('DEL')
    .on('click',function(){
        newRow.remove();
    })

})

d3.select('#saveConfig').on('click',function(){
    // @ record shape
    // key = serverName
    // value = {ip:-, id:-, pwd:-, path:-}
    var ttt = d3.selectAll('.serverInfo')
    .selectAll('div')
    .selectAll('input')
    .select(function(d,i,n){
        console.log(d);
        console.log(i);
        console.log(n);
    })



})

