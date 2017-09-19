/**
 * 静态资源自动化构建部署工具
 * 使用说明：
 *     1、开发阶段执行gulp即可，会自动监听主文件和子模块的变化后编译，但不监听主文件所在目录以外的模块变更
 *     2、上线部署依次运行gulp build -> gulp upload -> gulp deploy，注意查看控制台的返回信息，最后一步需谨慎
 * author：xzj08325@ly.com
 * 版权所有：猎鹰大前端
 */
'use strict';

// 基础类
var glob       = require('glob');
var path       = require('path');
var http       = require('http');
var request    = require('request');
var fs         = require('fs');
var gulp       = require('gulp');
var FormData   = require('form-data');

// 工具类
var rename     = require("gulp-rename");
var moment     = require("moment");
var colors     = require("colors/safe");
var del        = require('del');
var assign     = require('lodash.assign');
var archiver   = require('archiver');

// gulp插件
var minifycss  = require('gulp-minify-css');
var rev        = require('gulp-rev');
var base64     = require('gulp-base64');
var less       = require('gulp-less');
var notify     = require('gulp-notify');
var plumber    = require('gulp-plumber');

// browserify相关
var watchify   = require('watchify');
var browserify = require('browserify');
var uglify     = require('gulp-uglify');
var buffer     = require('vinyl-buffer');
var source     = require('vinyl-source-stream');
var through2   = require('through2');

// 报错抛出提示
var errorHandler = function(err) {
    renderLog.info('编译错误：', 'error');
    notify.onError(err.message)(err); // for growl
};

var renderLog = {
    info: function(msg) {
        console.log(colors.cyan("[" + moment().format('hh:mm:ss') + "] " + msg));
    },
    success: function(msg) {
        console.log(colors.green("[" + moment().format('hh:mm:ss') + "] " + msg));
    },
    warning: function(msg) {
        console.log(colors.yellow("[" + moment().format('hh:mm:ss') + "] " + msg));
    },
    error: function(msg) {
        console.log(colors.magenta("[" + moment().format('hh:mm:ss') + "] " + msg));
    }
};

var channel = (function() {
    var argv = process.argv.slice(2).join('');

    console.log(argv);

    if (!/--/gi.test(argv)) return null;

    return argv.split('--')[1];
})();

function checkChannel(callback) {
    if (!/(touch|pc|wx)/gi.test(channel)) {
        renderLog.error("请检查启动参数是否为touch、pc、wx之一");
        callback();
        process.exit(0);
    } else {
        callback();
    }
}

// 根据变动生成css与js，支持监听同目录下的子模块变动
function dev() {
    renderLog.info('开始监听Less和JS源文件，发生修改后会自动编译……');
    var watcher = gulp.watch(`${channel}/app/src/**/*.(less|js)`);
    watcher.on('change', function(filepath, stats) {
        console.log(filepath);
        var filename = path.basename(filepath);
        var dir = path.dirname(filepath);
        var isModule = /^_/gi.test(filename) ? true : false;
        var type = /\.less$/gi.test(filename) ? 'less' : 'js';
        var handler = /\.less$/gi.test(filename) ? buildCss : buildJs;
        handler(dir + '/!(_)*.' + type, function() {
            renderLog.success('[' + (isModule ? '模块' : '主文件') + filepath + ']发生了变化，编译成功');
        });
    });
}

// 编译less
function buildCss(file, callback) {
    if (typeof file !== 'string') {
        file = `./${channel}/app/src/**/!(_)*.less`;
        renderLog.info('开始重新编译所有Less文件，请稍候……');
    }

    return gulp.src(file)
        .pipe(plumber({ errorHandler: errorHandler }))
        .pipe(less())
        .pipe(rename(function (path) {
            path.dirname = '';
            path.basename = path.basename.toLowerCase();
        }))
        .pipe(gulp.dest(`./${channel}/app/dest/css`))
        .on('finish', function() {
            if (typeof callback === 'function') callback();
        });
}

// 编译js
function buildJs(file, callback) {
    if (typeof file !== 'string') {
        file = `./${channel}/app/src/**/!(_)*.js`;
        renderLog.info('开始重新编译所有JS文件，请稍候……');
    }
    return gulp.src(file)
        .pipe(through2.obj(function(file, enc, next) {
            watchify(browserify(assign({}, watchify.args, {  
                cache: {}, // required for watchify
                packageCache: {}, // required for watchify
                entries: [file.path]
                // transform: ['babelify']
            }))).bundle(function(err, res) {
                if (err) {
                    notify.onError(err.message)(err); // for growl
                    renderLog.error(err.stack);
                    return;
                } else {
                    file.contents = res;
                    next(null, file);
                }
            });
        }))
        .pipe(rename(function (path) {
            path.dirname = '';
            path.basename = path.basename.toLowerCase();
        }))
        .pipe(gulp.dest(`./${channel}/app/dest/js/`))
        .on('finish', function() {
            if (typeof callback === 'function') callback();
        });
}

function clean(callback) {
    del.sync([`${channel}/app/output/**`, `!${channel}/app/output`]);
    callback();
}

// 根据文件md5生成带hash的构建产物
function outputImg(callback) {
    return gulp.src(`./${channel}/app/img/*`)
        .pipe(rename(function (path) {
            path.dirname = '';
            path.basename = path.basename.toLowerCase();
        }))
        .pipe(rev())
        .pipe(gulp.dest(`${channel}/app/output/img`))
        .pipe(rev.manifest('hashimg.json'))
        .pipe(gulp.dest(`${channel}/app/output`))
        .on('finish', callback);
}

// 根据文件md5生成带hash的构建产物
function outputJs(callback) {
    return gulp.src(`./${channel}/app/dest/js/*.js`)
        .pipe(uglify())
        .pipe(rev())
        .pipe(gulp.dest(`${channel}/app/output/js`))
        .pipe(rev.manifest('hashjs.json'))
        .pipe(gulp.dest(`${channel}/app/output`))
        .on('finish', callback);
}

// 根据文件md5生成带hash的构建产物，同时更新css中的url为CDN地址
function outputCss(callback) {
    var imgHash = JSON.parse(fs.readFileSync(`./${channel}/app/output/hashimg.json`));

    return gulp.src([`./${channel}/app/dest/css/*.css`])
        .pipe(minifycss())
        .pipe(base64({
            extensions: ['jpg', 'png'],
            exclude:    [/\/\//],
            maxImageSize: 5*1024, // bytes 
            debug: false
        }))
        .pipe(rev())
        .pipe(through2.obj(function (file, enc, cb) {
            var contents = file.contents.toString();
            contents = contents.replace(/url\(["']?((?!(\/\/|http|data:image))(.*?))["']?\)/gi, function(match, p1) {
                var filename = path.basename(p1).toLowerCase();
                filename = imgHash[filename] ? imgHash[filename] : filename;
                return `url(//file.40017.cn/gny/v201708/${channel}/img/${filename})`;
            });

            file.contents = new Buffer(contents);

            this.push(file);
            cb();
        }))
        .pipe(gulp.dest(`${channel}/app/output/css`))
        .pipe(rev.manifest('hashcss.json'))
        .pipe(gulp.dest(`${channel}/app/output`))
        .on('finish', callback);
}

// 生成上传文件列表，打包，并生成配置文件
function upload(callback) {
    callback = typeof callback === 'function' ? callback : function() {};

    var css = JSON.parse(fs.readFileSync(`./${channel}/app/output/hashcss.json`));
    var js = JSON.parse(fs.readFileSync(`./${channel}/app/output/hashjs.json`));
    var img = JSON.parse(fs.readFileSync(`./${channel}/app/output/hashimg.json`));
    var originalConfig = JSON.parse(fs.readFileSync(`./${channel}/config.json`));
    var newConfig = {
        "js": js,
        "css": css,
        "img": img
    };
    var list = {
        "js": [],
        "css": [],
        "img": []
    };

    var count = {
        js: 0,
        css: 0,
        img: 0
    };

    for(var type in newConfig) {
        renderLog.info("本次需要上传的"+ type + "文件列表：");
        for(var key in newConfig[type]) {
            if (newConfig[type][key] !== originalConfig[type][key]) {
                list[type].push(`./${channel}/app/output/${type}/${newConfig[type][key]}`);
                renderLog.info(`\t${++count[type]}: ${newConfig[type][key]}`);
            } else {
                del.sync([`./${channel}/app/output/${type}/${newConfig[type][key]}`]);
            }
        }
    }

    if (count.js == 0 && count.css == 0 && count.img == 0) {
        renderLog.warning("本次没有文件需要上传！");
        callback();
        return;
    } else {
        process.stdin.resume();
        process.stdin.setEncoding('utf8');

        renderLog.info( '请确认上传文件列表是否正确，输入yes继续');

        process.stdin.on('data', function(data){
            var flag = data.toString().slice(0, -2);

            if (flag === 'yes') {
                var output = fs.createWriteStream(`./${channel}/app/output/upload.zip`);
                var archive = archiver('zip', {
                    zlib: { level: 9 } // Sets the compression level. 
                });
                output.on('close', function() {
                    renderLog.success("upload.zip文件大小：" + (+archive.pointer() / 1024 / 1024).toFixed(2) + 'MB');

                    uploadFileToLeo(`./${channel}/app/output/upload.zip`, 'product', function() {
                        callback();
                        process.exit(0);
                    }, function() {
                        renderLog.success(`文件成功上传至狮子座CDN，请执行gulp deploy --${channel}更新统一配置！`);
                        fs.writeFileSync(`${channel}/config.json`, JSON.stringify(newConfig, null, 4));
                        callback();
                        process.exit(0);
                    });
                });
                archive.on('warning', function(err) {
                    renderLog.warning(err);
                    callback();
                });
                archive.on('error', function(err) {
                    renderLog.error(err);
                    callback();
                });
                
                archive.pipe(output);
                 
                archive.directory(`./${channel}/app/output/css`, 'css');
                archive.directory(`./${channel}/app/output/js`, 'js');
                archive.directory(`./${channel}/app/output/img`, 'img');
                
                archive.finalize();
            } else {                
                process.stdin.end();
                return;
            }
        });
    }
}

// 生成打包好的zip到狮子座仓库
function uploadFileToLeo(file, env, errorHandler, callback) {
    var _fileData = fs.createReadStream(file);

    var formdata = {
        bucket_name: env === 'product' ? 'gny' : 'gnytest',
        key: `/v201708/${channel}/`,
        zipfile: _fileData
    };

    request.post({
        url: 'http://leonidapi.17usoft.com/libraapi2/leonid/v2/static/uploadzip/simple', 
        formData: formdata,
        headers: {
            'user-token': '1862a19cde6e09ef181dd1b618d4f5e3',
            'asset-key': '97d438fced5d64fa105b59b784668fb7'
        }
    }, function(err, res, body) {
        if (err) {
            renderLog.error('Connect Error：' + err);
            errorHandler();
            return;
        }
        if (JSON.parse(body).code != 0) {
            renderLog.error('Upload Error：' + body);
            errorHandler();
            return;
        }
        if (typeof callback === 'function') callback();
    });
}

// 更新统一配置
function deploy(callback) {
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    renderLog.info( '请输入你的5位工号：');

    process.stdin.on('data', function(data){
        var number = data.toString().slice(0, -2);

        if (!/^\d{5}$/gi.test(number)) {
            renderLog.error("工号格式不正确，请重新输入！");
            process.stdin.end();
            return;
        }

        var config = JSON.parse(fs.readFileSync(`./${channel}/config.json`));
        delete config.img;
        request.post({
            url: 'http://tccomponent.17usoft.com/tcconfigcenter6/v6/modifyandpushconfig', 
            json: {
                "projectName" : "tcintervacation.hubber.web",//天眼标示
                "key"         : `feresource_gny_dotnet_${channel}`,//key
                "value"       : JSON.stringify(config),//value
                "cacheType"   : "update",//具体的操作,支持add,update,delete
                "userName"    : number,//具体操作人的工号
                "open"        : true,//是否可以被其他项目读取
                "env"         : "product"//具体的环境
            },
            headers: {
                "Authorization" : "Basic dGNpbnRlcnZhY2F0aW9uLmh1YmJlci53ZWI6dGNpbnRlcnZhY2F0aW9uLmh1YmJlci53ZWI=",
                "Content-Type"  : "application/json"
            }
        }, function(err, res, body) {
            if (err) {
                renderLog.error('Push Config Error：' + err);
                callback();
                return;
            }
            renderLog.success("统一配置更新成功！本次发布已结束，请认真验收线上！");
            callback();
        });
    });
}

// 部署预发环境
function stage(callback) {
    var output = fs.createWriteStream(`./${channel}/app/output/stage.zip`);
    var archive = archiver('zip', {
        zlib: { level: 9 } // Sets the compression level. 
    });
    output.on('close', function() {
        var filesize = (+archive.pointer() / 1024 / 1024).toFixed(2);
        renderLog.success("stage.zip文件大小：" + filesize + 'MB');
        if (filesize > 10) {
            renderLog.warning('预发文件包已经超过10M，建议检查是否有未使用的图片！');
        }

        uploadFileToLeo(`./${channel}/app/output/stage.zip`, 'stage', function() {
            callback();
        }, function() {
            renderLog.success('文件成功上传至狮子座CDN！');
            callback();
        });
    });
    archive.on('warning', function(err) {
        renderLog.warning(err);
        callback();
    });
    archive.on('error', function(err) {
        renderLog.error(err);
        callback();
    });
    
    archive.pipe(output);
     
    archive.directory(`./${channel}/app/dest`, 'dest');
    archive.directory(`./${channel}/app/img`, 'img');
    
    archive.finalize();
}

// 注册任务
gulp.task(dev); // 开发阶段监听变化
gulp.task(buildCss); // 重新编译所有less
gulp.task(buildJs); // 重新编译所有JS
gulp.task(stage); // 部署预发环境

gulp.task(clean);
gulp.task(outputImg);
gulp.task(outputCss);
gulp.task(outputJs);

gulp.task(checkChannel);


// 默认任务，先编译所有JS和CSS，然后开始监听
gulp.task('default', gulp.series(
    function check(done) {
        checkChannel(done);
    }, 
    'buildCss', 'buildJs', 'dev'
));

// 部署预发环境，直接把app/dest和app/img打包发送至测试服务器
gulp.task('stage', gulp.series(
    function check(done) {
        checkChannel(done);
    }, 
    'checkChannel', 'buildCss', 'buildJs', 'stage',
    function finish(done) {
        renderLog.success('预发环境部署成功');
        done();
        process.exit(0);
    }
));

// build
gulp.task('build', gulp.series(
    function check(done) {
        checkChannel(done);
    }, 
    'checkChannel', 
    'clean', 
    gulp.parallel('buildCss', 'buildJs'), 
    'outputImg',
    gulp.parallel('outputCss', 'outputJs'), 
    function finish(done) {
        renderLog.success(`文件构建完毕，请执行gulp upload --${channel}上传至狮子座`);
        done();
        process.exit(0);
    }
));

gulp.task('upload', gulp.series(
    function check(done) {
        checkChannel(done);
    }, 
    function(done) {
        upload(done);
    }
));

gulp.task('deploy', gulp.series(
    function check(done) {
        checkChannel(done);
    }, 
    function(done) {
        deploy(function() {
            done();
            process.exit(0);
        })
    }
));