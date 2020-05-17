/**
 * EmailController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
var fs = require('fs');
var hogan = require('hogan.js');
var nodemailer = require('nodemailer');

module.exports = {

    sendMail: function(req,res){
        if (!req.body) {
            return res.status(400).send({ msg: "give corect params" });
        }
        if(req.body && Object.keys(req.body).length){
            data = req.body;
            (data.email) ? data.email : null;
            (data.message) ? data.message : null;
            (data.startDate) ? data.startDate : null;
            if(data.email == null || data.email == ""){
                return res.send({msg:"Please Provide Email Id"});
            }
            var template = fs.readFileSync(__dirname + "/../template/campStart.html", 'utf8');
            var compiledTemplate = hogan.compile(template);
            var smtpTransport = nodemailer.createTransport({
                service: "SendGrid",
                auth: {
                  user: sails.config.sendGrid.user,
                  pass: sails.config.sendGrid.pass
                }
              });
                mailOptions = {
                    from : 'info@videotap.com',
                    to: data.email,
                    subject: data.message,
                    html: compiledTemplate.render({date: data.startDate})
                }
                smtpTransport.sendMail(mailOptions, function (error, response) {
                    if (error) {
                        res.end("error");
                    } else {
                        res.send({success: true});
                    }
                });
        }
       
    },

    sendMailCron: function(eData){
        if (!eData) {
            return;
        }
        if(eData && Object.keys(eData).length){
            data = eData;
            (data.email) ? data.email : null;
            (data.message) ? data.message : null;
            (data.startDate) ? data.startDate : null;
            if(data.email == null || data.email == ""){
                return;
            }
            if(eData.campEnd){
                var template = fs.readFileSync(__dirname + "/../template/campEnd.html", 'utf8');
            } else {
                var template = fs.readFileSync(__dirname + "/../template/campStart.html", 'utf8');
            }
            

            var compiledTemplate = hogan.compile(template);
            var smtpTransport = nodemailer.createTransport({
                service: "SendGrid",
                auth: {
                  user: sails.config.sendGrid.user,
                  pass: sails.config.sendGrid.pass
                }
              });
                mailOptions = {
                    from : 'info@videotap.com',
                    to: data.email,
                    subject: data.message,
                    html: compiledTemplate.render({date: data.startDate})
                }
                smtpTransport.sendMail(mailOptions, function (error, response) {
                    if (error) {
                        console.log(err);
                    } else {
                        return true;
                    }
                });
        }
       
    }

};

