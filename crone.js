var _ = require('@sailshq/lodash');
var moment = require('moment');
var EmailController = require('../api/controllers/EmailController');
var DashboardController = require('../api/controllers/DashboardController');
var CampaignconfigController = require('../api/controllers/CampaignconfigController');
module.exports.cron = {

  // Send mail to user for updating campaing related information
    myFirstJob: {
        schedule: '00 00 12 * * *',
        onTick: function() {
          console.log('I am triggering Email every one day');
          Campaign.find({}).populate("user").exec(function (err, camp) {
              if(err) return;
              if(camp || camp.length > 0){
              var zoneTime1 = moment().toDate();
              var zoneTime2 = moment().subtract(1,'days').toDate();      
                
            var a = _.filter(camp,function(e){
                var date = moment(e.stdate).toDate();
                return moment(date).isBefore(zoneTime1) && moment(date).isAfter(zoneTime2);
            })
            // console.log(a);
            if(a && a.length > 0){
               _.forEach(a,function(d){
                    console.log(d.user.email);
                    var data = {
                        email : d.user.email,
                        message: 'Campaign Started' + d.name ,
                        startDate:  moment(d.stdate).toDate()
                    }
                    EmailController.sendMailCron(data);
               })
            }
          
            }
          })
        }
    },
    // Update impression into the publisher mapping
    updateImpression: {
      schedule: '00 02 01 * * *',
      onTick: function () {
        console.log('I am triggering ');
        Publishermediaplanning.find({}).exec( function (err, camp) {
          if (err) return;
          if (camp || camp.length > 0) {
            console.log(camp)
            _.forEach(camp, async function (ca) {
              var campFilterArr = [];
              campFilterArr.push({
                value: ca.id,
              })
              var selectedFromDate = moment(ca.stdate).toDate();
              var selectedToDate = moment(ca.eddate).toDate();
              var filterSet = {
                date: {
                  startDate: selectedFromDate,
                  endDate: selectedToDate
                },
                videoid: campFilterArr,
                publisher: []
              }
              var data = await DashboardController.fetchImpressionCron(filterSet);
              console.log(data)

              if (data && data.length > 0) {
                ca.imp = data.data.IMP;
                ca.views = data.data.TV;
              }
            })


          }
        })
      }
    }
    // Update campaign data into publisher and campaign mongo document 
    ,updateCampData:{
      schedule: '00 00 */1 * * *',
      onTick: function () {
        console.log('I am updateCampData ');
        DashboardController.updateCamp();
        DashboardController.updatePub();
      }
    },
        // Update Campaign Config in Redis 
        CampaignConfig:{
          schedule: '00 */1 * * * *',
          onTick: function () {
            console.log('I am updating Campaign Config ');
            CampaignconfigController.create_cron()
            CampaignconfigController.findAll_cron();
          }
        },

        //capping
        campaign_capping:{
          schedule: '00 */1 * * * *',
          onTick: function () {
            console.log('Capping cron is getting executed ');
            // CampaignconfigController.campaign_capping();
            
          }
        },
  };