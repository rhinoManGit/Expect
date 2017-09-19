/**
 * Created by Administrator on 2017/9/18 0018.
 */
function Index(){}

var Action = Index.prototype;

Action.index = function(req, res, next){
    res.render('index', { title: 'Express' });
}

module.exports = new Index();