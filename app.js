var express      = require('express');

var path         = require('path');
var favicon      = require('serve-favicon');
var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');

// 日志
var log          = require('./tools/logger');
// 路由
var routes       = require('./routes/transitVessel');
// 中间件
var assignId     = require('./middlewares/assignId');
var ticking      = require('./middlewares/ticking');

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
app.use(assignId);

app.use(morgan(':status :method :url :response-time :date[web]'));

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'static')));
app.use(routes);

// start timed task
//ticking();

// catch 404 and forward to error handler
app.use(function(req, res, next) {

  var err = new Error('Not Found');

  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {

    log.warn(`[NEXT]: ErrorID: ${err.log_uuid}`);

    // 写入日志
    log.error(err);

    // render the error page
    res.status(err.status || 500);
    res.render('common/error', {message:'', error: err});
});

module.exports = app;
