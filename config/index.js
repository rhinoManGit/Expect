/**
 * Created by Administrator on 2017/9/18 0018.
 */

exports.getConfig = function(key){

    var env = process.env.rhinoHorn || 'dev';

    var config = require('./config_' + env);

    return config[key];
}