/**
 * Created by wd14931 on 2016/1/4.
 * commond:
 *  less: 编译所有的less
 *
 */
'use strict';

var http = require('http');
var iconv = require('iconv-lite');
var querystring = require('querystring');
var gulp = require('gulp');
var less = require('gulp-less');
var watch = require('gulp-watch');
var notify = require('gulp-notify');
var plumber = require('gulp-plumber');
var source = require('vinyl-source-stream');
var watchify = require('watchify');
var browserify = require('browserify');
var sourcemaps = require('gulp-sourcemaps');
var assign = require('lodash.assign');
var buffer = require('vinyl-buffer');
var gutil = require('gulp-util');
var minifycss = require('gulp-minify-css');
var uglify = require('gulp-uglify');
var rev = require('gulp-rev');
var replace = require('gulp-replace');
var del = require('del');
var glob = require('glob');
var path = require('path');
var sftp = require('gulp-sftp');
var base64 = require('gulp-base64');
var fs = require('fs');
var tmodjs = require('tmodjs');

var tpl = {
    name: 'rhino',
    imgRoot:"//file.40017.cn/feresource/gny-img/touch/",
    illegal: /alert\(/g,
    to: 'wd14931@ly.com'
};

// 报错抛出提示
var onError = function (err) {
    gutil.log('======= ERROR. ========\n');
    notify.onError("ERROR: " + err.message)(err); // for growl
    gutil.beep();
};

// 首次进来先获取缓存数据存起来
var /*cacheJSON  = require('./cache.json'),
    */bUpload = {},
    bConfig = {};

var _listen = function(obj, prop, fn){

    return Object.defineProperty(obj, prop, {
        get: function(){
            return this['_'+prop];
        },
        set: function(newValue){

            if(this['_'+prop] !== newValue){
                this['_'+prop] = newValue;
                fn(newValue);
            }
        }
    });
};

// 监听上传状态
_listen(bUpload, 'cursor', updateCache);
bUpload['cursor'] = 0;
// 监听上传状态
_listen(bConfig, 'update', updateConfigHandle);
bConfig['update'] = 0;
/*
 * upload
 * 首先会先判断有没有文件上传
 * 如果有：才去连接， 否则不连接
 *
 * */
function upload(cfg, callback){

    if(!cfg.files.length)
        cfg.files = 'thetcbestfrontteam/*.gnyfrontteam';

    return gulp.src(cfg.files)
        .pipe(sftp({
            host: cfg.host || '',
            port: cfg.port || '',
            auth: cfg.auth || '',
            remotePath: cfg.path,
            callback: function(){
                gutil.log(gutil.colors.green(cfg.log) + gutil.colors.yellow(' SFTP connection is closed.'));
            }
        }))
        .on('error', function(e){
            gutil.log(gutil.colors.red(e.message));

            throw 'User name or password is incorrect! please stop!!';
        })
        .on('finish', function(){
            callback && callback();
        });
}


function buildCss(styleSrc){
    gulp.src(styleSrc, {client: './'})
        .pipe(plumber({errorHandler: onError}))
        .pipe(sourcemaps.init())
        .pipe(less())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./app/dest/css'))
        .on('finish', function(){});
}

// require编译
function bundle(b, file) {
    return b.bundle()
        .on("error", notify.onError(function (error) {
            gutil.log('======= ERROR. ========\n', error);
            return "Message to the notifier: " + error.message;
        }))
        .pipe(source(file))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./app/dest/js'));
}


function tmodjsTask(callback){

    var tmod = new tmodjs("app/tpl", {
        type: "commonjs",
        minify: false,
        cache: false
    });

    tmod.watch();
    callback();
}


// 根据变动生成css与js
function buildCssAndJs(){

    watch('app/src/**/!(_)*.less',function(event) {

        var path = event.path.replace(/\\/g, '/'),
            reg = path.match(/(\/app\/src(\/\w+)*)?\/([\w]+.less)?$/),
            src = reg[0];

        buildCss(src.substring(1));
        gutil.log(gutil.colors.green("SUCCESS: " + src.substring(1) + '  finished!'));

    });

    watch(['app/src/**/!(_)*.js'],function(event) {

        var path = event.path.replace(/\\/g, '/');

        var reg = path.match(/\/((app\/(src|tpl\/build)\/(\w+)*)?\/([\w]+.js))?$/),
            src = reg[1],
            fileName = reg[5];


        var b = watchify(browserify(assign({}, watchify.args, {
            cache: {},
            packageCache: {},
            entries: [src]
        })));

        b.on('log', gutil.log);

        bundle(b, fileName);

        return;
    });

}

/*
 编译所有的less
 */
function Less(callback){

    glob('app/src/**/!(_)*.less', {}, function (err, files) {

        files.forEach(function (file) {

            buildCss(file);

            gutil.log(gutil.colors.green("SUCCESS: " + file + '  finished!'));

        });

        callback();
    });
}


/*
 编译所有的js
 注：执行此命令的时候请注释掉下面的 [default]任务行
 */
function reset(callback){

    glob('app/src/**/!(_)*.js', {}, function (err, files) {

        files.forEach(function (file) {

            var reg = file.match(/(app\/src\/(\w+)*)?\/([\w]+.js)?$/),
                fileName = reg[3];

            var b = browserify();

            b.add(file);
            b.bundle()
                .on("error", function (error) {
                    gutil.log(gutil.colors.red('BUILD_ERROR: '+error.message));
                })
                .pipe(fs.createWriteStream('./app/dest/js/'+ fileName));

            gutil.log(gutil.colors.green("SUCCESS: " + file + '  finished!'));

        });
    });

    callback();
}


/**
 *  gulp build
 */

/*
 * clean output
 * */
function clean(callback){
    del.sync(['app/output/**', '!app/output']);
    callback();
}
/*
 * clean uplod.json
 * */
function cleanUpload(callback) {
    writeJson('./upload.json', []);
    callback();
}

/*
 *
 * img CDN
 * */
function cdnImg(callback){

    glob('app/img/*', {}, function (err, files) {

        // addCDN
        return gulp.src(files)
            .pipe(rev())
            .pipe(gulp.dest('./app/output/img'))
            .pipe(rev.manifest('img.json', {
                base: './output',
                merge: true // merge with the existing manifest (if one exists)
            }))
            .pipe(gulp.dest('./app/output/img'))
            .on('finish', callback);
    });
}

/*
 *
 * js CDN
 *
 * */
function cdnJs(callback){

    glob('app/min/js/*.js', {}, function (err, files) {

        // addCDN
        return gulp.src(files)
            .pipe(rev())
            .pipe(gulp.dest('./app/output/js'))
            .pipe(rev.manifest('js.json', {
                base: './output',
                merge: true // merge with the existing manifest (if one exists)
            }))
            .pipe(gulp.dest('./app/output/js'))
            .on('finish', callback);
    });
}

/*
 *
 * minCss
 *
 * */

function minCss(callback){
    return gulp.src('./app/dest/css/*.css')
        .pipe(minifycss())
        .pipe(gulp.dest('app/min/css'))
        .on('finish', callback);
}

/*
 *
 * compress
 *
 * */
function compress(callback){
    return gulp.src('app/dest/js/*.js')
        .pipe(uglify())
        .pipe(gulp.dest('app/min/js'))
        .on('finish', callback);
}

/*
 *
 * find illegal in content
 * */

function findIllegalChar(callback){

    return gulp.src("app/min/js/*.js")
        .pipe(notify(function (file) {

            var fileName = file.relative;
            // 将buffer 转为字符串
            var content = String(file.contents);
            var aIllegal = content.match(tpl.illegal);

            if(aIllegal){
                return gutil.colors.yellow('Found ' + aIllegal + ' in ' + fileName);
            }
        }))
        .on('finish', callback);
}

/*
 *
 * replaceUrl
 *
 * */
function replaceUrl(callback){

    var imgJson = readJson('app/output/img.json'),
        aUploading = [];

    return gulp.src(['app/min/css/*.css'])
        .pipe(replace(/url\(["']?\.\.\/\.\.\/img\/(.*?)["']?\)/gi, function(match, p1) {

            if(!imgJson[p1]){
                gutil.log(gutil.colors.red('ERROR: '+p1 + ' is missing'));
            }

            // 生成img的到上传列表
            if(!cacheJSON[p1] || cacheJSON[p1] !== imgJson[p1]){
                aUploading.indexOf(p1) === -1 && aUploading.push(p1);
            }

            return 'url(' + tpl.imgRoot + imgJson[p1] + ')';
        }))
        .pipe(rev())
        .pipe(gulp.dest('./app/output/css'))
        .pipe(rev.manifest('css.json', {
            base: './output',
            merge: true // merge with the existing manifest (if one exists)
        }))
        .pipe(gulp.dest('app/output/css'))
        .on('finish', function(){

            fs.writeFile('upload.json', JSON.stringify(aUploading, null, 4), callback);
            callback();
        });
}

/*
 *
 * base64
 *
 * */
function imgIncodeBybase64(callback){

    glob('./app/min/css/*.css', {}, function (err, files) {

        if(err){
            return gutil.log(gutil.colors.red('ERROR: in imgIncodeBybase64!'));
        }

        return gulp.src(files)
            .pipe(base64({
                extensions: [/^["']?\.\.\/\.\.\/img\/(.*?).(png|jpg|gif)["']?$/i],
                maxImageSize: 8*1024, // bytes
                debug: false
            }))
            .pipe(gulp.dest('app/min/css'))
            .on('finish', callback);
    });
}

/*
 *
 * update wechat
 *
 * */
function update(callback){

    var sFile = {
        js: {},
        css:{}
    };
    var json = readJson('app/output/js.json');

    for(var k in json){
        sFile.js[k.replace('.js', '')] = json[k];
    }

    var cssJson = readJson('app/output/css.json');

    for(var j in cssJson){
        sFile.css[j.replace('.css', '')] = cssJson[j];
    }

    // 删除
    del.sync(['app/min/**']);

    writeJson('app/output/usemin.json', sFile);
    /**************/
    callback();
}

/*
 * 生成上传列表
 *
 * */
function uploadList(callback){

    fs.readFile('upload.json', 'utf8', function(err, data){

        if(err){
            return gutil.log(gutil.colors.red('ERROR: updateCache error!'));
        }

        var aUploading = JSON.parse(data);

        fs.readFile('app/output/js.json', 'utf8', function(err, data){

            if(err){
                return gutil.log(gutil.colors.red('ERROR: updateCache error!'));
            }

            var jsJson = JSON.parse(data);

            for(var k in jsJson){

                if(!cacheJSON[k] || cacheJSON[k] !== jsJson[k]){
                    aUploading.push(k);
                }
            }

            fs.readFile('app/output/css.json', 'utf8', function(err, data){

                if(err){
                    return gutil.log(gutil.colors.red('ERROR: updateCache error!'));
                }

                var cssJson = JSON.parse(data);

                for(var i in cssJson){

                    if(!cacheJSON[i] || cacheJSON[i] !== cssJson[i]){
                        aUploading.push(i);
                    }
                }

                fs.writeFile('upload.json', JSON.stringify(aUploading, null, 4), callback);
            });
        });
    });
}


/*
 *
 * FTP Part
 *
 * */

/*
 *
 * read json
 *
 * */
function readJson(fileName){
    var json = JSON.parse(fs.readFileSync(fileName));

    return json;
}

/*
 *
 * write json
 *
 * */
function writeJson(fileName, data){

    fs.writeFileSync(fileName, JSON.stringify(data));
}

/*
 *
 * find upload file
 *
 * */
function findUploadFile(destFile, reg, prefix){

    var json = readJson('upload.json');
    var imgJson = readJson(destFile);

    var reg = reg || /(.png|.jpg|.gif)$/;

    json = json.filter(function(f){

        return reg.test(f);
    });

    json = json.map(function(f){
        return prefix + imgJson[f];
    });

    return json;
}

/*
 *
 * FTP Part
 *
 * */
function serverImgA(callback){

    var aFile = findUploadFile('app/output/img.json', false, 'app/output/img/');

    return uploadFile({
        src: aFile,
        lib: 'feresource',
        outputDir: 'gny-img/touch'
    }, function(){
        bUpload['cursor']++;
        callback();
    });
}

/* js */
function serverJsA(callback){

    var aFile = findUploadFile('app/output/js.json', /.js$/, 'app/output/js/');

	aFile.forEach(function(f){
        aFile.push('app/dest/js/' + f.split('/').pop().split('-')[0]+ '.js')
    })
    
    return uploadFile({
        src: aFile,
        lib: 'feresource',
        outputDir: 'gny-js/touch'
    }, function(){
        bUpload['cursor']++;
        callback();
    });
}

/* css */
function serverCssA(callback){

    var aFile = findUploadFile('app/output/css.json', /.css$/, 'app/output/css/');

    return uploadFile({
        src: aFile,
        lib: 'feresource',
        outputDir: 'gny-css/touch'
    }, function(){
        bUpload['cursor']++;
        callback();
    });
}

/*
 * 更新缓存
 * */
function updateCache(callback){

    if(bUpload['cursor'] < 3){
        return;
    }

    var cache = {};

    var cssJson = readJson('app/output/css.json');

    for(var k in cssJson){
        cache[k] = cssJson[k];
    }

    var jsJson = readJson('app/output/js.json');

    for(var k in jsJson){
        cache[k] = jsJson[k];
    }

    var imgJson = readJson('app/output/img.json');

    for(var k in imgJson){
        cache[k] = imgJson[k];
    }

    fs.writeFile('cache.json', JSON.stringify(cache, null, 4), function(){

        writeJson('./upload.json', []);

    });
}

/*
* 更新配置手柄
*
* */
function updateConfigHandle(){

    if(bConfig['update'] - 0 === 0){
        return;
    }

    var userList = [''];

    if(userList.indexOf(process.env['USERNAME']) === -1){
        return gutil.log(gutil.colors.red('抱歉！发布权限不够！'));
    }

    var sValue = fs.readFileSync('./app/output/usemin.json').toString();

    var data = {
        "key": "fe_resource_touch",
        "value": sValue
    };

    var content = querystring.stringify(data);

    gutil.log(gutil.colors.green(sValue))

    var req = http.request(opt, function (res) {

        var chunks = [];
        var size = 0;

        // 请求回流
        res.on('data', function (chunk) {

            chunks.push(chunk)
            size += chunk.length;
        });

        // res 结束
        res.on('end', function () {

            var buf = Buffer.concat(chunks, size);
            var str = iconv.decode(buf, 'utf-8');

            gutil.log('统一配置更新：',gutil.colors.green(str));
        });
    });

    req.on('error', function (e) {

        gutil.log(gutil.colors.red('统一配置 error：', e));

    });

    req.write(content);
    req.end();
}

/*
* 更新配置文件
*
* */
function updateConfig(callback){

    /*
    * 询问
    * */
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    gutil.log(gutil.colors.yellow('请确认后端资源已经发布。你确定要更新配置: yes or no ?'));

    process.stdin.on('data', function(data){

        if(data.toString().replace(/\s+/, '') === 'yes')
            bConfig['update'] = 1;
        else
            process.stdin.end();

        callback();
    });

    process.stdin.on('end', function(){
        process.stdout.write('end');
    });
}

//default task
gulp.task(tmodjsTask);
gulp.task(buildCssAndJs);

//编译所有的less
gulp.task(Less);
//编译所有的js
gulp.task(reset);

// register task
gulp.task(clean);
gulp.task(cleanUpload);
gulp.task(cdnImg);
gulp.task(cdnJs);
gulp.task(minCss);
gulp.task(compress);
gulp.task(replaceUrl);
gulp.task(imgIncodeBybase64);
gulp.task(update);
gulp.task(uploadList);
//gulp.task(findIllegalChar);

// upload
gulp.task(serverImgA);
gulp.task(serverJsA);
gulp.task(serverCssA);

// update config
gulp.task(updateConfig);

gulp.task('default', gulp.series('reset', 'Less', 'tmodjsTask', 'buildCssAndJs'));

gulp.task('compile', gulp.series('reset', 'Less'));

// build
gulp.task('build', gulp.series('clean', 'cleanUpload', 'minCss', 'compress', 'cdnImg', 'imgIncodeBybase64', 'replaceUrl', 'cdnJs', 'uploadList', 'update'));

// FTP deploy
gulp.task('p', gulp.series('serverImgA','serverJsA', 'serverCssA'));

/*// update config
gulp.task('conf', gulp.series('updateConfig'));

// public
gulp.task('prod', gulp.series('reset', 'Less', 'build', 'p', 'conf'));*/
