/**
 * Created by Administrator on 2017/9/20 0020.
 */
var Common = require('./JsAndCss');

function Report(obj){

    this['title']     = obj.title || '��������';

    this['pageName']  = obj.pageName || 'report';
}

// �̳�config
Report.prototype = new Common();

module.exports = Report;

