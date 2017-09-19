/**
 * Created by Administrator on 2017/9/19 0019.
 */
var uuid = require('node-uuid');

exports.assignId = function(req, res, next) {
    req.log_uuid = uuid.v4();
    next()
}
