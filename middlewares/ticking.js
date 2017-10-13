/**
 * Created by Administrator on 2017/9/26 0026.
 * 所有与请求无关的定时任务
 *
 */
var autoSendEmailForAgent= require('./../tools/autoSendEmailForAgent');
var autoSendEmailForExam= require('./../tools/autoSendEmailForExam');

function Ticking(){

    // 定时发送邮件
    autoSendEmailForAgent();
    autoSendEmailForExam();
}

module.exports = Ticking;
