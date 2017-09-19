var express      = require('express');

var path         = require('path');
var favicon      = require('serve-favicon');
var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');

var log          = require('./tools/logger');
var util         = require('./tools/utils');
var routes       = require('./routes/transitVessel');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

/*
* generate token
* */
morgan.token('id', function getId (req) {
    return req.log_uuid
})

app.use(util.assignId);
app.use(morgan(':status :method :url :response-time :date[web]'))
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'static')));
app.use(routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {

  var err = new Error('Not Found');

  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {

    /*
    * 如果一条错误信息达到一定数量或者一定时间则考虑发送邮件
    * */

    /*if(count > 10){

        // 发送邮件，短信通知 todo
        log.warn('send!!');
        // 清除
        log.countReset(label);
    }*/

    log.error(`[NEXT]: ErrorID: ${err.log_uuid} \n ${err.stack}`);

    // render the error page
    res.status(err.status || 500);
    res.render('error', {message:'', error: err});
});

module.exports = app;
