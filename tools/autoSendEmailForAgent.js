/**
 * Created by Administrator on 2017/9/25 0025.
 */
var server    = require('./../service/');
var sendEmail = require('./sendEmail');
var logger    = require('./logger');
var config    = require('./../config').config();
var Excel     = require('exceljs');
var sName     = '代理商：';

var getAgentHandle = async function () {

    try{
        var data = await server.getAgentList();

        var preDate      = (new Date(+new Date - 24 * 60 * 60 * 1000)),
            sDate        = '[' + preDate.getFullYear() + '-' + (preDate.getMonth() - (-1)) + '-' + preDate.getDate() + ']';

        /*
         * 写入Excel
         * */
        var workbook = new Excel.stream.xlsx.WorkbookWriter({
            filename: './cache/agentlist.xlsx'
        });

        var worksheet = workbook.addWorksheet('Sheet');

        worksheet.columns = [
            { header: '姓名',     key: 'name' },
            { header: '企业名称', key: 'company' },
            { header: '电话',     key: 'phone' },
            { header: '邮箱',     key: 'email' },
            { header: '时间',     key: 'createTime' },
            { header: '备注',     key: 'remark' }
        ]

        for(let i in data)
            worksheet.addRow(data[i]).commit();

        workbook.commit();

        /*
         * 发送邮件
         * */
        var aToAddresses = ['mayuwei@fclassroom.com','info@fclassroom.com','pujiongye@fclassroom.com'];

        // 抄送
        var aCcAddresses = ['wangwei@fclassroom.com'];

        var account = {
            host   : 'smtp.exmail.qq.com',
            user   : config.Email_Authorization_user,
            pass   : config.Email_Authorization_code,
            from   : '<' + config.Email_Authorization_user + '>',
            to     : aToAddresses,
            cc     : aCcAddresses,
            subject: sDate + '官网中录入的代理商统计列表',
            text   : '',
            html   : '你好 马予炜、浦炯晔：<br\> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;下面是' + sDate + '期间录入的代理商的列表。<br\>见附件，请查收！ 谢谢',
            attachments:
                [
                    {
                        filename: sDate + '.xlsx',
                        path: './cache/agentlist.xlsx' // stream this file
                    }
                ]
        }

        // 发邮件
        sendEmail(account, function(err, info){

            if(err) throw (err);

            logger.log(`${sDate} 10:00:00 send Email ${JSON.stringify(info)}`)
        });
    }catch(e){
        logger.error(e);
    }
}

/*
 * 定时获取录入代理的信息
 * 首先计算多久到达10点，然后24小时一次
 * */
var current   = new Date();
var firstTime = + new Date(current.getFullYear() + '/' + (current.getMonth()-(-1))+'/'+current.getDate()+ ' 10:00:00');

var firstTick = firstTime - (+current);
var nextTick  = 1000 * 60 * 60 * 24;
var tick      = nextTick;

if(firstTick < 0){
    firstTick += nextTick;
}

logger.log(`${sName}距离下次发送时间：${parseInt(firstTick/(1000*60*60))}小时,${(firstTick%(1000*60*60))/(60*1000)}分钟}`);

function sendHandle(){

    // 发送
    getAgentHandle();

    logger.log(`${sName}距离下次发送时间：${nextTick/(1000*60*60)}小时}`);

    setTimeout(function(){
        sendHandle();
    }, nextTick)
}

function startTick(){

    setTimeout(function(){

        logger.log(`${sName}首次发送时间：${new Date()}`);

        sendHandle();
    }, firstTick);
}

module .exports = startTick;