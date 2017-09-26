/**
 * Created by Administrator on 2017/9/22 0022.
 */
'use strict';
const nodemailer = require('nodemailer');
const fs         = require('fs');

// Generate test SMTP service account from ethereal.email
// Only needed if you don't have a real mail account for testing
function sendEmail(account, cb){

    var _option  = account || {},
        callback = cb      || function(){};

    nodemailer.createTestAccount(() => {

        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
            host  : 'smtp.exmail.qq.com',
            secure: true, // true for 465, false for other ports
            auth  : {
                    user: _option.user, // generated ethereal user
                    pass: _option.pass  // generated ethereal password
                }
        });

        // setup email data with unicode symbols
        let mailOptions = {
            from       : _option.from    || '', // sender address
            to         : _option.to      || '', // list of receivers
            cc         : _option.to      || '',
            subject    : _option.subject || '', // Subject line
            text       : _option.text    || '', // plain text body
            html       : _option.html    || '',// html body
            attachments: _option.attachments || []
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, (error, info) => {

            if (error) return callback(error, info);

            console.log('Message sent: ', info.messageId);
            // Preview only available when sending through an Ethereal account
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

            callback(null, info);
        });
    });
}

module.exports = sendEmail;
