/**
 * Created by Administrator on 2017/9/19 0019.
 */
var fs            = require('fs');
var Console       = require('console').Console;
const style = {
    'bold'          : ['\x1B[1m',  '\x1B[22m'],
    'italic'        : ['\x1B[3m',  '\x1B[23m'],
    'underline'     : ['\x1B[4m',  '\x1B[24m'],
    'inverse'       : ['\x1B[7m',  '\x1B[27m'],
    'strikethrough' : ['\x1B[9m',  '\x1B[29m'],

    'white'         : ['\x1B[37m', '\x1B[39m'],
    'grey'          : ['\x1B[90m', '\x1B[39m'],
    'black'         : ['\x1B[30m', '\x1B[39m'],
    'blue'          : ['\x1B[34m', '\x1B[39m'],
    'cyan'          : ['\x1B[36m', '\x1B[39m'],
    'green'         : ['\x1B[32m', '\x1B[39m'],
    'magenta'       : ['\x1B[35m', '\x1B[39m'],
    'red'           : ['\x1B[31m', '\x1B[39m'],
    'yellow'        : ['\x1B[33m', '\x1B[39m'],

    'whiteBG'       : ['\x1B[47m', '\x1B[49m'],
    'greyBG'        : ['\x1B[49;5;8m', '\x1B[49m'],
    'blackBG'       : ['\x1B[40m', '\x1B[49m'],
    'blueBG'        : ['\x1B[44m', '\x1B[49m'],
    'cyanBG'        : ['\x1B[46m', '\x1B[49m'],
    'greenBG'       : ['\x1B[42m', '\x1B[49m'],
    'magentaBG'     : ['\x1B[45m', '\x1B[49m'],
    'redBG'         : ['\x1B[41m', '\x1B[49m'],
    'yellowBG'      : ['\x1B[43m', '\x1B[49m']
}
var config = require('./../config/');

/*
* key: stdout, stderr
* */
function getStream(key){

    var env = config.getConfig('env');

    var stream = {
        pro: {
            output: fs.createWriteStream('./log/stdout.log'),
            stderr: fs.createWriteStream('./log/stderr.log')
        },
        dev: {
            output: process.stdout,
            stderr: process.stderr
        }
    }

    return stream[env][key];
}

function Log(out, err){
    this.logger = new Console(out, err);
}

Log.prototype.log = function(str){
    return this.logger.log.call(null, style.cyan[0] + str + style.cyan[1]);
}

Log.prototype.info = function(str){
        return this.logger.info.call(null, style.white[0] + str + style.white[1]);
}

Log.prototype.warn = function(str){
    return this.logger.warn.call(null, style.yellow[0] + str + style.yellow[1]);
}

Log.prototype.error = function(str){
    return this.logger.error.call(null, style.red[0] + str + style.red[1]);
}

/*
* label string
* */
Log.prototype.count = function(label){
    return this.logger.count.call(null, label);
}

/*
 * label string
 * */
Log.prototype.countReset = function(label){
    return this.logger.countReset.call(null, label);
}

/*
 * label string
 * */
Log.prototype.time = function(label){
    return this.logger.time.call(null, label);
}

/*
 * label string
 * */
Log.prototype.timeEnd = function(label){
    return this.logger.timeEnd.call(null, label);
}


module.exports = new Log(getStream('output'), getStream('stderr'));