/**
 * Created by Administrator on 2017/9/22 0022.
 */
var mysql      = require('mysql');
var config     = require('./../config').config();

function JDBC(){}

var that = JDBC.prototype;

that.connect = function(){

    var connection = mysql.createConnection({
        host     : config.db_host,
        port     : config.db_port,
        user     : config.db_us,
        password : config.db_ps,
        database : config.db_DB
    });
    connection.connect();

    return connection;
}

that.find = function(query, cb){

    var connection = this.connect();

    connection.query(query, function (error, results, fields) {

        console.log(error)
        if (error) throw error;

        cb(error, results);
    });
}

module.exports = new JDBC();
