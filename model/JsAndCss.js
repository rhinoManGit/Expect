/**
 * Created by Administrator on 2017/9/20 0020.
 */
var config  = require('./../config/');
var version = require('./../config/cacheVersion.json');

function JsAndCss(){

    // 所有的model都继承config
    this._config = config.config();

    this.getCss();
    this.getJs();
    this.getCommon();
}

JsAndCss.prototype.getCss = function(){

    var env = this._config['env'];
    var tpl = {
        pro: 'app/output/css/',
        test: 'app/dest/css/'
    }

    var name = env === 'pro'? version['css'][this.pageName] : this.pageName + '.css';

    this.link = (tpl[env] || tpl['test']) + name;
}

JsAndCss.prototype.getJs = function(){

    var env = this._config['env'];
    var tpl = {
        pro: 'app/output/js/',
        test: 'app/dest/js/'
    }

    var name = env === 'pro'? version['js'][this.pageName] : this.pageName + '.js';

    this.script = (tpl[env] || tpl['test']) + name;
}

JsAndCss.prototype.getCommon = function(){

}

module.exports = JsAndCss;