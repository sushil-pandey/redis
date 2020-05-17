/* eslint-disable quotes */
/* eslint-disable camelcase */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable one-var */
/**
 * AdserverController
 *
 * @description :: Server-side actions for handling incoming requests.
 *                 AdTag passes ad calls to this contoller. GetAds parse the request and fetch matching available campaign from Redis Cache
 *                 If No Matching Ad then responded with code 204.
 *                 If matching found then AdTag is responded.
 *                 Code can write to log to physical file, which will be commented on production or archived
 *                 It post message to Kafka stream - dsp_adserver_stream
 *                 Uses IP2Location for Geo Details and device dector for identifying the device
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
var jwt = require('jsonwebtoken');

module.exports = {

  getAds: function (req, res) {
    console.log('----------------------------------------------------------------------');

    const fs = require('fs');
    var ip2loc = require("ip2location-nodejs");
    var dd = require('device-detector');
    var curnow = new Date();
    var curdatetime = curnow.toISOString();
    var curdate = curdatetime.slice(0, 10);
    var curhr = curnow.getHours();
   
    // request param
    let s = req.query.s,
      vtid = req.query.vtid,
      bidid = req.query.bidid,
      ca = req.query.ca,
      s_type = req.query.sourceType,
      zoneId= req.query.zoneid,
      cookieSource = JSON.parse(req.query.cookieSource),
      filename = 'adServer_' + curdatetime.replace(/-/g, '').slice(0, 8),
      DIR = './dsplogs/',
      //respnse = '200:sucess',
      ext = '.log';
    //console.log('Request received', ca, s);

    // collect all the details from request /  header
    let ip = req.ip,
      ips = req.ips, //x-forwarded-for
      host = req.hostname,
      ua = req.headers['user-agent'],
      refer = req.header('Referer');

    //get country and city details using ip   
    ip2loc.IP2Location_init("./ip2loc/DB19.BIN");
    var ip2details = ip2loc.IP2Location_get_all('52.172.143.211');
    //console.log(ip,ips);
    //var ip2details = ip2loc.IP2Location_get_all(ip);
    //console.log(ip2details.country_long);
    var country = ip2details.country_long,
      city = ip2details.city,
      isp = ip2details.isp;

    // console.log('Details from locator:', city, country, isp);

    // plugin device detector get device type
    var deviceInfo = dd.parse(ua);
    let deviceType = deviceInfo.type,
      browser = deviceInfo.browser,
      os = deviceInfo.os;

    // console.log(browser, deviceType, os);

    redisClient.get("RediscampaignConfig", function (err, products) {
      // reply is null when the key is missing
      //console.log('new redis log - ', products);
      if (err) {
        console.log(err);
        return res.serverError(err);
      }
      NewConfigRedis = JSON.parse(products);
      // console.log('all campaign list : ',NewConfigRedis);
      //  country='India';
      // city='Noida';

      var filtercondition = {
        country: country,
        city: city,
        os: os,
        browser: browser,
        trafficSource: deviceType,
        //  iabCategory: category,
        //  exchange : s,
        // isp : isp,
        // connectivity : ctype,
        // w: w,
        // h: h,
        // creativeType :  creativeType
      };

      if (ca && ca.length > 5) {
        //console.log('campaign ca-', ca);
        //filtercondition.push({campaignId : ca}) 
        filtercondition.campaignid = ca;
      }
      //console.log('options - ', filtercondition);
      var _campaigns = NewConfigRedis.filter(function (obj) {
        // console.log('111:asd',obj.campaignid);
        for (var key in filtercondition) {

          if (obj[key].indexOf('ALL') > -1 || obj[key].indexOf(filtercondition[key]) > -1) {
            // console.log('mapping');
          } else {
            // console.log('not mapping');
            return false;
          }
        }
        return true;
      });
      var checkCampRetargeting = false;
      var aud_seg = [];
      var cookie = req.cookies;
      var ar = Object.keys(cookie);
      const match = ar.find(value => /^vt_retar/.test(value)); 

      _.forEach(_campaigns,function(c){
        let ca = c.campaignid,
        cr = c.creativeid,
        p = c.bid,
        creativeType = c.creativeType;         
          if(match == undefined && c.audience.length > 0){
            c.audience.forEach(val => {
               var tag= "<img src='" + sails.config.custom.adserver_impURI + "/setcookie?aud={AUD}&ca={CA}&s={SR}&cr={CR}&s_type={STYPE}' style='width:1px;height:1px'>";
               var a = tag.replace(/{AUD}/g,val).replace(/{CA}/g, ca).replace(/{CR}/g, cr).replace(/{SR}/g, s).replace(/{STYPE}/g, 'DIRECT');
               aud_seg.push(a);
            });
          }

          if(match && c.retargetting.length > 0 && c.retargetting != 'ALL'){
            _.forEach(c.retargetting,function(r){
              var data = jwt.verify(req.cookies[match], sails.config.secret);
              if(data.aud == r){
                checkCampRetargeting = true;
                console.log(checkCampRetargeting);
              }
            })
            }
      })
     

      if (_campaigns.length === 0) {
        console.log('no campaign found');


        var vtapdspadsunq = 0,
          vtapdspadscount = 0,
          cr = 'NA', p = 'NA';
        if (!ca) { ca = 'NA'; }
        if (!vtid) { vtid = 'C' + ca + 'A' + s + 'R' + cr + curdatetime.replace(/-/g, '').replace(/\./g, '').replace(/:/g, ''); }
        if (!bidid) { bidid = vtid; }
        // prepare content for logging
        //generate log
        data = curdatetime + ',' + curdate + ',' + curhr + ',' + 'adserver' + ',' + ca + ',' + cr + ',' + s + ',' + s_type + ',' + bidid + ',' + vtid + ',' + p + ',' + ip + ',' + ips + ',' + host + ',' + ua + ',' + refer + ',' + country + ',' + city + ',' + browser + ',' + os + ',' + deviceType + ',' + isp + ',,,,' + vtapdspadsunq + ',' + vtapdspadscount + '\n';

        // write to file log
        // write to file
        var stream = fs.createWriteStream(DIR + filename + ext, { flags: 'a' });
        stream.write(data);


        // send msg to kafka starts here
        // push to kafka
        const event = {
          req: 'Adserver',
          timestamp: Date.now(),
          remarks: 'Request Received',
          data: data
        };
        const buffer = new Buffer.from(JSON.stringify(event));

        // Create a new payload
        const record = [
          {
            topic: "dsp_adserver_stream",
            messages: buffer,
            attributes: 1 /* Use GZip compression for the payload */
          }
        ];
        // kfkproducer.send(record, function (err, data) {
        //   if(err) { console.log(err);}
        //   console.log(data);
        // });

        return res.status(204).send('no bid');



      } else {
        var randomCampaign=[];
        if(cookieSource && cookieSource.length > 0){
          _campaigns.forEach(campaign => {
            // let findFreq = _.find(cookieSource.)
            if(campaign.frequency){
              cookieSource.forEach(cookie=>{
                if(cookie.ca === campaign.campaignid){
                  console.log('Campaign and cookie matched')
                  if(cookie.count < campaign.frequency){
                    randomCampaign.push(campaign);
                  }
                  
                } else {
                  randomCampaign.push(campaign);
                }
              })
  
            } else {
              randomCampaign.push(campaign);
            }

          });
        } else {
          randomCampaign = _campaigns;
        }


        if(randomCampaign.length < 1){
          return res.status(204).send('no bid-freqExceed');
        }
        var randomValue = randomCampaign[Math.floor(Math.random() * randomCampaign.length)];
        // console.log(randomValue);
        //  console.log('Filtered Campaign:',_campaigns);
        console.log('filtered: lenght : ', _campaigns.length, NewConfigRedis.length);


        vtapdspadsunq = req.cookies.vtapdspadsunq;
        vtapdspadscount = req.cookies.vtapdspadscount;

        if (!vtapdspadsunq) { vtapdspadsunq = 1; } else { vtapdspadsunq = 0; }
        if (!vtapdspadscount) { vtapdspadscount = 1; } else { vtapdspadscount = parseInt(vtapdspadscount) + 1; }
        // prepare content for logging
        //generate log
        let ca = randomValue.campaignid,
          cr = randomValue.creativeid,
          p = randomValue.bid,
          creativeType = randomValue.creativeType;

        if (!vtid) { vtid = 'C' + ca + 'A' + s + 'R' + cr + curdatetime.replace(/-/g, '').replace(/\./g, '').replace(/:/g, ''); }
        if (!bidid) { bidid = vtid; }
        // 3rd party pixel
        let r_imp = randomValue.imp.replace(/{CB}/g, vtid);
        if (r_imp) {
          r_imp = "<img src='" + r_imp + "' style='width:1px;height:1px'>";
        } else {
          r_imp = '';
        }
        //vt dsp pixel
        // console.log(sails.config);
        v_imp = "<img src='" + sails.config.custom.adserver_impURI + "/imp/track?ca={CA}&s={SR}&cr={CR}&cb={CB}&s_type={STYPE}&vtid={CB}&bibid={CB}&p={PR}' style='width:1px;height:1px'>";

        v_imp = v_imp.replace(/{CB}/g, vtid).replace(/{CA}/g, ca).replace(/{CR}/g, cr).replace(/{SR}/g, s).replace(/{STYPE}/g, 'DIRECT').replace(/{PR}/g, p);
        var VtAdTag = randomValue.adtag.replace(/{CA}/g, ca).replace(/{CR}/g, cr).replace(/{SR}/g, s).replace(/{STYPE}/g, s_type).replace(/{ZONEID}/g, zoneId);

        if(creativeType === 'Banner'){
          console.log('list of banners',randomValue.mainimage);
            finalBannerAd =randomValue.mainimage[Math.floor(Math.random() * randomValue.mainimage.length)];  ;
            console.log('Banner choosed',finalBannerAd);
            VtAdTag = "<a href='"+ randomValue.lp+"' ><img src='http://localhost:1337/images/"+finalBannerAd+"' /></a>";
        }
        var respMsg ={
          s : s,
          ca : ca,
          p : p,
          cr : cr,
          VtAdTag : VtAdTag,
          v_imp : v_imp,
          r_imp : r_imp,
          aud_seg : aud_seg
        };


        data = curdatetime + ',' + curdate + ',' + curhr + ',' + 'adserver' + ',' + ca + ',' + cr + ',' + s + ',' + s_type + ',' + bidid + ',' + vtid + ',' + p + ',' + ip + ',' + ips + ',' + host + ',' + ua + ',' + refer + ',' + country + ',' + city + ',' + browser + ',' + os + ',' + deviceType + ',' + isp + ',,,,' + vtapdspadsunq + ',' + vtapdspadscount + '\n';

        // write to file log
        // write to file
        var stream = fs.createWriteStream(DIR + filename + ext, { flags: 'a' });
        stream.write(data);


        // send msg to kafka starts here
        // push to kafka
        const event = {
          req: 'Adserver',
          timestamp: Date.now(),
          remarks: 'Request Received',
          data: data
        };
        const buffer = new Buffer.from(JSON.stringify(event));

        // Create a new payload
        const record = [
          {
            topic: "dsp_adserver_stream",
            messages: buffer,
            attributes: 1 /* Use GZip compression for the payload */
          }
        ];
        // kfkproducer.send(record, function (err, data) {
        //   if(err) { console.log(err);}
        //   console.log(data);
        // });

        console.log(respMsg);
        return res.ok(respMsg);
        //return res.ok('success');
      }


    });


  },

  vpaidTag : function(req,res){
    console.log('Request for vpaid Tag');
    const fs = require('fs');
    var curnow = new Date();
    var curdatetime = curnow.toISOString();
    var curdate = curdatetime.slice(0, 10);
    var curhr = curnow.getHours();
   
    let s = req.query.s,
      vtid = req.query.vtid,
      bidid = req.query.bidid,
      ca = req.query.ca,
      cr = req.query.cr,
      s_type = req.query.s_type,
      filename = 'adServer_' + curdatetime.replace(/-/g, '').slice(0, 8),
      DIR = './dsplogs/',
      //respnse = '200:sucess',
      ext = '.log';

      if(!cr) { return res.status(204).send('no bid');}
      if(!ca){ ca = cr;  }
      if(!s_type) { s_type='DIRECT';}

      redisClient.get("RediscampaignConfig",function(err,rediscampaign){
        if(err){ console.log(err); return res.serverError(err);}
        NewConfigRedis = JSON.parse(rediscampaign);
        var filtercondition = {
          country: country,
          city: city,
          os: os,
          browser: browser,
          trafficSource: deviceType,
          //  iabCategory: category,
          //  exchange : s,
          // isp : isp,
          // connectivity : ctype,
          // w: w,
          // h: h,
          // creativeType :  creativeType
        };
  
        if (ca && ca.length > 5) { filtercondition.campaignid = ca; }
        var _campaigns = NewConfigRedis.filter(function (obj) {
          // console.log('111:asd',obj.campaignid);
          for (var key in filtercondition) {
  
            if (obj[key].indexOf('ALL') > -1 || obj[key].indexOf(filtercondition[key]) > -1) {
              // console.log('mapping');
            } else {
              // console.log('not mapping');
              return false;
            }
          }
          return true;
        });
        if(_campaigns.length === 0){
            console.log('no campaign found');
            var vtapdspadsunq = 0,
            vtapdspadscount = 0,
            cr = 'NA', p = 'NA';
            if (!ca) { ca = 'NA'; }
            if (!vtid) { vtid = 'C' + ca + 'A' + s + 'R' + cr + curdatetime.replace(/-/g, '').replace(/\./g, '').replace(/:/g, ''); }
            if (!bidid) { bidid = vtid; }
            // prepare content for logging
            //generate log
            data = curdatetime + ',' + curdate + ',' + curhr + ',' + 'adserver' + ',' + ca + ',' + cr + ',' + s + ',' + s_type + ',' + bidid + ',' + vtid + ',' + p + ',' + ip + ',' + ips + ',' + host + ',' + ua + ',' + refer + ',' + country + ',' + city + ',' + browser + ',' + os + ',' + deviceType + ',' + isp + ',,,,' + vtapdspadsunq + ',' + vtapdspadscount + '\n';

            // write to file log
            // write to file
            var stream = fs.createWriteStream(DIR + filename + ext, { flags: 'a' });
            stream.write(data);


            // send msg to kafka starts here
            // push to kafka
            const event = {
              req: 'Adserver',
              timestamp: Date.now(),
              remarks: 'Request Received',
              data: data
            };
            const buffer = new Buffer.from(JSON.stringify(event));

            // Create a new payload
            const record = [
              {
                topic: "dsp_adserver_stream",
                messages: buffer,
                attributes: 1 /* Use GZip compression for the payload */
              }
            ];
            // kfkproducer.send(record, function (err, data) {
            //   if(err) { console.log(err);}
            //   console.log(data);
            // });
            return res.status(204).send('no bid');
         } else {
          var randomValue = _campaigns[Math.floor(Math.random() * _campaigns.length)];
          console.log('filtered: lenght : ', _campaigns.length, NewConfigRedis.length);
          vtapdspadsunq = req.cookies.vtapdspadsunq;
          vtapdspadscount = req.cookies.vtapdspadscount;
  
          if (!vtapdspadsunq) { vtapdspadsunq = 1; } else { vtapdspadsunq = 0; }
          if (!vtapdspadscount) { vtapdspadscount = 1; } else { vtapdspadscount = parseInt(vtapdspadscount) + 1; }
          // prepare content for logging
          //generate log
          let ca = randomValue.campaignid,
            cr = randomValue.creativeid,
            p = randomValue.bid;
          // 3rd party pixel
          let videostart = randomValue.videostart,
              q1 = randomValue.q1,
              q2 = randomValue.q2,
              q3=randomValue.q3,
              q4=randomValue.q4,
              aderror=randomValue.aderror,
              adpause=randomValue.adpause,
              adresume=randomValue.adresume,
              adskip=randomValue.adskip,
              adviewport=randomValue.adviewport,
              mute=randomValue.mute,
              unmute=randomValue.unmute,
              imp=randomValue.imp,
              ClickThrough=randomValue.ClickThrough;

            if (!vtid) { vtid = 'C' + ca + 'A' + s + 'R' + cr + curdatetime.replace(/-/g, '').replace(/\./g, '').replace(/:/g, ''); }
            if (!bidid) { bidid = vtid; }
            
            data = curdatetime + ',' + curdate + ',' + curhr + ',' + 'adserver' + ',' + ca + ',' + cr + ',' + s + ',' + s_type + ',' + bidid + ',' + vtid + ',' + p + ',' + ip + ',' + ips + ',' + host + ',' + ua + ',' + refer + ',' + country + ',' + city + ',' + browser + ',' + os + ',' + deviceType + ',' + isp + ',,,,' + vtapdspadsunq + ',' + vtapdspadscount + '\n';

            // write to file log
            // write to file
            var stream = fs.createWriteStream(DIR + filename + ext, { flags: 'a' });
            stream.write(data);


            // send msg to kafka starts here
            // push to kafka
            const event = {
              req: 'Adserver',
              timestamp: Date.now(),
              remarks: 'Request Received',
              data: data
            };
            const buffer = new Buffer.from(JSON.stringify(event));

            // Create a new payload
            const record = [
              {
                topic: "dsp_adserver_stream",
                messages: buffer,
                attributes: 1 /* Use GZip compression for the payload */
              }
            ];
            // kfkproducer.send(record, function (err, data) {
            //   if(err) { console.log(err);}
            //   console.log(data);
            // });
            
            var blocked_source = ['1','2','3','4','1234'];
            var blocked_cr = ['1','2','3','4'];

            //console.log(_.indexOf(blocked_source,s));
            if(_.indexOf(blocked_source,s) > -1 || _.indexOf(blocked_cr,cr) > -1){
              console.log('Blocked source or Creative:',s,'-',cr);
              return res.ok('Blocked source  or Creative');
            }

            var event_url = sails.config.custom.vpaid_event_url;
            var vpaid_creative_js = sails.config.custom.vpaid_creative_js;
            var ClickThrough_url = sails.config.custom.ClickThrough_url
            var imp_url = sails.config.custom.imp_url;
            
          // console.log(' event_url', event_url);
            return res.set("Content-type", "application/xml").send(`<?xml version="1.0" encoding="UTF-8"?>
            <VAST version="3.0">
            <Ad id="`+curdatetime+`">
            <InLine>
            <AdSystem>VideoTap</AdSystem>
            <AdTitle>VideoTap Smart Video Ad</AdTitle>
            <Error>
            <![CDATA[
            ` + event_url + `?ca=`+vtvideoid+`&s=`+vtsource+`&cr=`+vtvideoid+`&s_type=`+s_type+`&p=1&e=error&et=adtag&ea=auto&ev=&smtid=videotapvideoid&cm=`+aderror+`&err=[ERRORCODE]
            ]]>
            </Error>
            <Impression>
            <![CDATA[
            ` + imp_url + `?ca=`+vtvideoid+`&s=`+vtsource+`&cr=`+vtvideoid+`&s_type=`+s_type+`&p=1&e=error&et=adtag&ea=auto&ev=&smtid=videotapvideoid&cm=`+imp+`
            ]]>
            </Impression>
            <Creatives>
            <Creative id="`+cr+`">
            <Linear>
            <Duration>00:00:30</Duration>
            <TrackingEvents>
            <Tracking event="start">
            <![CDATA[
            ` + event_url + `?ca=`+vtvideoid+`&s=`+vtsource+`&cr=`+vtvideoid+`&s_type=`+s_type+`&p=1&e=error&et=adtag&ea=auto&ev=&smtid=videotapvideoid&cm=`+videostart+`
            ]]>
            </Tracking>
            <Tracking event="firstQuartile">
            <![CDATA[
            ` + event_url + `?ca=`+vtvideoid+`&s=`+vtsource+`&cr=`+vtvideoid+`&s_type=`+s_type+`&p=1&e=error&et=adtag&ea=auto&ev=&smtid=videotapvideoid&cm=`+q1+`
            ]]>
            </Tracking>
            <Tracking event="midpoint">
            <![CDATA[
            ` + event_url + `?ca=`+vtvideoid+`&s=`+vtsource+`&cr=`+vtvideoid+`&s_type=`+s_type+`&p=1&e=error&et=adtag&ea=auto&ev=&smtid=videotapvideoid&cm=`+q2+`
            ]]>
            </Tracking>
            <Tracking event="thirdQuartile">
            <![CDATA[
            ` + event_url + `?ca=`+vtvideoid+`&s=`+vtsource+`&cr=`+vtvideoid+`&s_type=`+s_type+`&p=1&e=error&et=adtag&ea=auto&ev=&smtid=videotapvideoid&cm=`+q3+`
            ]]>
            </Tracking>
            <Tracking event="complete">
            <![CDATA[
            ` + event_url + `?ca=`+vtvideoid+`&s=`+vtsource+`&cr=`+vtvideoid+`&s_type=`+s_type+`&p=1&e=error&et=adtag&ea=auto&ev=&smtid=videotapvideoid&cm=`+q4+`
            ]]>
            </Tracking>
            <Tracking event="skip">
            <![CDATA[
            ` + event_url + `?ca=`+vtvideoid+`&s=`+vtsource+`&cr=`+vtvideoid+`&s_type=`+s_type+`&p=1&e=error&et=adtag&ea=auto&ev=&smtid=videotapvideoid&cm=`+adskip+`
            ]]>
            </Tracking>
            <Tracking event="mute">
            <![CDATA[
            ` + event_url + `?ca=`+vtvideoid+`&s=`+vtsource+`&cr=`+vtvideoid+`&s_type=`+s_type+`&p=1&e=error&et=adtag&ea=auto&ev=&smtid=videotapvideoid&cm=`+mute+`
            ]]>
            </Tracking>
            <Tracking event="unmute">
            <![CDATA[
            ` + event_url + `?ca=`+vtvideoid+`&s=`+vtsource+`&cr=`+vtvideoid+`&s_type=`+s_type+`&p=1&e=error&et=adtag&ea=auto&ev=&smtid=videotapvideoid&cm=`+unmute+`
            ]]>
            </Tracking>
            <Tracking event="pause">
            <![CDATA[
            ` + event_url + `?ca=`+vtvideoid+`&s=`+vtsource+`&cr=`+vtvideoid+`&s_type=`+s_type+`&p=1&e=error&et=adtag&ea=auto&ev=&smtid=videotapvideoid&cm=`+adpause+`
            ]]>
            </Tracking>
            <Tracking event="resume">
            <![CDATA[
            ` + event_url + `?ca=`+vtvideoid+`&s=`+vtsource+`&cr=`+vtvideoid+`&s_type=`+s_type+`&p=1&e=error&et=adtag&ea=auto&ev=&smtid=videotapvideoid&cm=`+adresume+`
            ]]>
            </Tracking>
            </TrackingEvents>
            <AdParameters>
            <![CDATA[
            {"videoid":"`+cr+`", "autoplay":"on","source":"`+s+`","source_type":"`+s_type+`","campaignid":"`+ca+`" }
            ]]>
            </AdParameters>
            <VideoClicks>
            <ClickThrough id="Videotap">
            <![CDATA[ 
              ` + ClickThrough_url + `?ca=`+vtvideoid+`&s=`+vtsource+`&cr=`+vtvideoid+`&s_type=`+s_type+`&p=1&e=error&et=adtag&ea=auto&ev=&smtid=videotapvideoid&cm=`+ClickThrough+`
            ]]>
            </ClickThrough>
            </VideoClicks>
            <MediaFiles>
            <MediaFile id="Videotap_VPAID_JS_ABC" delivery="progressive" width="1280" height="720" apiFramework="VPAID" type="application/javascript" scalable="false" maintainAspectRatio="true">
            <![CDATA[ `+ vpaid_creative_js +` ]]>
            </MediaFile>
            </MediaFiles>
            </Linear>
            </Creative>
            </Creatives>
            </InLine>
            </Ad>
            </VAST>
            `);


         }

      });





  }

};

