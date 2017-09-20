/**
 * Created by Administrator on 2017/9/20 0020.
 */
var JsAndCss = require('./JsAndCss');
var Common   = require('./Common');

function Report(obj){

    this['title']     = obj.title || '报表中心';

    this['pageName']  = obj.pageName || 'report';

    /*
    * 添加地址引用
    * */
    JsAndCss.call(this);
}

// 继承公共属性: config
Report.prototype = new Common();

module.exports = Report;

