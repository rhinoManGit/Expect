/**
 * Created by Administrator on 2017/9/18 0018.
 * 报表中心
 */
var ReportModel = require('./../model/Report');

function Report(){}

var Action = Report.prototype;

Action.index = function(req, res, next){

    var test = {
        pageName: 'report',
        title: '极课大数据'
    }

    var reportModel = new ReportModel(test);

    res.render('report', reportModel);
}

module.exports = new Report();