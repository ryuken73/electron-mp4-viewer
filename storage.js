var d3 = require('./d3.min.js');
var UIkit = require('./uikit.min.js');


d3.select('#test').on('click',function(){
    var key = d3.select('#name').property('value');
    var sex = 'male';
    var age = d3.select('#age').property('value');
    localStorage[key] = JSON.stringify({sex:sex,age:age})
})


d3.select('#loadStorage').on('click', function(){
    console.log(localStorage);
    console.log(JSON.parse(localStorage['ryu']));
    console.log(localStorage.length);

})

d3.select('#clearStorage').on('click', function(){
    localStorage.clear();
})

