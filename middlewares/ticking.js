/**
 * Created by Administrator on 2017/9/26 0026.
 * 所有与请求无关的定时任务
 *
 */
var autoSendEmail= require('./../tools/autoSendEmail');

function Ticking(){

    // 定时发送邮件
    autoSendEmail();
}

module.exports = Ticking;
