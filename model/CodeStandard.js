/**
 * Created by Administrator on 2017/9/20 0020.
 */
var JsAndCss = require('./JsAndCss');
var Common   = require('./Common');

function CodeStandard(obj){

    this['title']     = obj.title || '前端代码规范';

    this['pageName']  = obj.pageName || 'codeStandard';

    /*
    * 添加地址引用
    * */
    JsAndCss.call(this);
}

// 继承公共属性: config
CodeStandard.prototype = new Common();

module.exports = CodeStandard;

