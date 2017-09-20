/**
 * Created by Administrator on 2017/9/20 0020.
 */
var Common = require('./JsAndCss');

function Report(obj){

    this['title']     = obj.title || '报表中心';

    this['pageName']  = obj.pageName || 'report';
}

// 继承config
Report.prototype = new Common();

module.exports = Report;

