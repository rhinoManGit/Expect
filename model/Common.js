/**
 * Created by Administrator on 2017/9/20 0020.
 */
var config  = require('./../config/');

/*
* config
* */
function Common() {
    this._config = config.config();
}

module.exports = Common;
