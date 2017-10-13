/**
 * Created by Administrator on 2017/9/22 0022.
 */
var jdbc = require('./../tools/JDBC');

function Index(){}

var action = Index.prototype;

/*
* get agent list for same day
*
* */
action.getAgentList = function(){

    var sql = 'SELECT * FROM application_info WHERE (SELECT  DATE_FORMAT(CreateTime,\'%Y-%m-%d\')) =  (SELECT (DATE_FORMAT((SELECT(DATE_ADD(NOW(),INTERVAL -1 DAY))), \'%Y-%m-%d\')));';

    return new Promise(function(resolve, reject){

        jdbc.find(sql, function(err, data){

            if (err)
                reject(err);
            else
                resolve(data);
        });
    })
}

/*
 * get exam list for same day
 *
 * */
action.getExamList = function(){

    var sql = 'SELECT * FROM activity_exam WHERE (SELECT  DATE_FORMAT(CreateTime,\'%Y-%m-%d\')) =  (SELECT (DATE_FORMAT((SELECT(DATE_ADD(NOW(),INTERVAL -1 DAY))), \'%Y-%m-%d\')));';

    return new Promise(function(resolve, reject){

        jdbc.find(sql, function(err, data){

            if (err)
                reject(err);
            else
                resolve(data);
        });
    })
}

module.exports = new Index();