/**
 * Created by Administrator on 2017/9/18 0018.
 */

exports.getConfig = function(key){

    var env = process.env['node_env'] || 'dev';

    var config = require('./config_' + env);

    return config[key];
}

exports.config = function(){

    var env = process.env['node_env'] || 'dev';

    var _config = require('./config_' + env);

    return _config;
}