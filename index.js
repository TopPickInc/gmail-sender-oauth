var gmailApiSync = require('gmail-api-sync');
var google = require('googleapis');
var MailComposer = require("nodemailer/lib/mail-composer");

exports.setClientSecretsFile = function (path) {
    gmailApiSync.setClientSecretsFile(path);
};
exports.resetCredentials = function (callback) {
    gmailApiSync.resetCredentials(callback);
};
exports.send = function (token, params, callback) {

    gmailApiSync.authorizeWithToken(token, function (err, oauth) {
        if (err) {
            return callback('Auth error: ' + err, null);
        }
        var gmail = google.gmail('v1');
        // var headers = [];

        var mail = new MailComposer({
            from: params.from,
            to: params.to,
            subject: params.subject,
            html: params.body,
            attachments: params.attachments.map(a => {
                return {
                    filename: a.name,
                    content: a.base64Content,
                    encoding: 'base64'
                }
            })
        });

        mail.compile().build(function(err, message) {
            if (err) {
                return callback('Unable to compile message: ' + err, null);
            } else {
                var reqParams = {
                    auth: oauth,
                    userId: 'me',
                    resource: {
                        raw: message.toString('base64').replace(/\+/g, '-').replace(/\//g, '_')
                    }
                };

                if (params.threadId && params.threadId !== 'null') {
                    reqParams.resource.threadId = params.threadId;
                }
        
                gmail.users.messages.send(reqParams, null, function (err, resp) {
                    if (!err) {
                        return callback(null, resp);
                    }
                    else {
                        return callback(`Unable to send email: ${err.message}`, null);
                    }
                });
            }
        });
    });
};
