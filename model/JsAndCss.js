/**
 * Created by Administrator on 2017/9/20 0020.
 */
var version = require('./../config/cacheVersion.json');

function JsAndCss(){
    getCss.call(this);
    getJs.call(this);
    getCommon.call(this);
}

function getCss(){

    var env = this._config['env'];
    var tpl = {
        pro: '/app/output/css/',
        test: '/app/dest/css/'
    }

    var name = env === 'pro'? version['css'][this.pageName] : this.pageName + '.css';

    this.link = (tpl[env] || tpl['test']) + name;
}

function getJs(){

    var env = this._config['env'];
    var tpl = {
        pro: '/app/output/js/',
        test: '/app/dest/js/'
    }

    var name = env === 'pro'? version['js'][this.pageName] : this.pageName + '.js';

    this.script = (tpl[env] || tpl['test']) + name;
}

function getCommon(){

}

module.exports = JsAndCss;