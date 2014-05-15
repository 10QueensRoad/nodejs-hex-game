// ------
// This is something I copied from the internets.
// To run
// $ node runAllSpecs.js
// ------

var jasmine = require('jasmine-node');
var sys = require('sys');
_ = require('./resources/js/lib/lodash-2.4.1');

for(var key in jasmine) {
    global[key] = jasmine[key];
}

var isVerbose = true;
var showColors = true;

process.argv.forEach(function(arg){
    switch(arg) {
        case '--color': showColors = true; break;
        case '--noColor': showColors = false; break;
        case '--verbose': isVerbose = true; break;
    }
});

jasmine.executeSpecsInFolder({specFolders: [__dirname + '/spec']}, function(runner, log){
    if (runner.results().failedCount == 0) {
        process.exit(0);
    }
    else {
        process.exit(1);
    }
}, isVerbose, showColors);