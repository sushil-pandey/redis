/**
 * CampaignconfigController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
var moment = require('moment');
var EmailController = require('./EmailController');

module.exports = {
  
  

  /**
   * `CampaignconfigController.create()`
   */
  create_cron: async function (req, res) {
    var arrayCampaignConfig = new Array();
    var datatoIns;

    Campaignconfig.destroy({}).then(_configd=>{
              console.log('removing old one');
              Campaign.find({status:'Active',trafficStatus:'Active'}).then(_campaigns=>{
                console.log('We have ',_campaigns.length,' Active Campaigns to validate')
              // fetch all campaign and loop thru
              _campaigns.forEach(campaign => {
                // fetch all associated creatives for each campaign
                //  console.log('for each campaign id:',campaign.id);
                  Campaigncreative.find({campaignid : campaign.id}).then(_campcreative=>{
                    //fetch creative and creative details
                 //   console.log('avaiale creative:',_campcreative)
                    _campcreative.forEach(forcreatives => {
                 //     console.log('for each creative id: ',forcreatives.creativeid);
                      Creative.find({id:forcreatives.creativeid,status:'Active',trafficStatus:'Active'}).populate('creativedetail').then(crt=>{
                        // console.log('creative',creatives);
                       //console.log('_campcreative:',forcreatives.creativeid,creatives);
        
                       crt.forEach(creatives => {
                        //  // creatives.id,
                        datatoIns={
                              campaignid : campaign.id,
                              name  :     campaign.name ,
                              stdate :     campaign.stdate,
                              eddate :     campaign.eddate,
                              tbudget  :     campaign.tbudget ,
                              dbudget  :     campaign.dbudget ,
                              timp   :     campaign.timp  ,
                              dimp   :     campaign.dimp  ,
                              // bid :     campaign.bid,
                              // minbid: minbid,
                              // maxbid: maxbid,
                              // pmpid: pmpid,
                              // timeZone: timeZone,
                            
                            // Geo Targetting :   // Geo Targetting,
                            country  :   campaign.country ,
                            countryOption  :   campaign.countryOption ,
                            city  :   campaign.city ,
                            cityOption  :   campaign.cityOption ,
                            
                            //device targetting :   //device targetting,
                            os  :   campaign.os ,
                            osOption  :   campaign.osOption ,
                            browser  :   campaign.browser ,
                            browserOption  :   campaign.browserOption ,
                            
                            //traffic :   //traffic,
                            trafficSource  :   campaign.trafficSource ,
                            iabCategory  :   campaign.iabCategory ,
                            iabCategoryOption  :   campaign.iabCategoryOption ,
                            exchange  :   campaign.exchange ,
                            
                            //carrier :   //carrier,
                            isp  :   campaign.isp ,
                            ispOption  :   campaign.ispOption ,
                            connectivity  :   campaign.connectivity ,
                            
                            //traffic optimize :   //traffic optimize,
                            
                            frequency  :   campaign.frequency ,
                            optimizeBy  :   campaign.optimizeBy ,
                            retargetting  :   campaign.retargetting ,
                            
                            status : campaign.status,
                            trafficStatus : campaign.trafficStatus,
                            remarks : campaign.remarks,
              
                            // creative 
                            creativeid : creatives.id,
                            creativename : creatives.name,
                            creativeType : creatives.creativeType,
                            advdomain : creatives.advdomain,
                            lp : creatives.lp,
                            imp : creatives.imp,
                            click : creatives.click,
              
                            // creative details
                            creativedetailsid : creatives.creativedetail[0].id,
                            iabsize : creatives.creativedetail[0].iabsize,
                            adtag : creatives.creativedetail[0].adtag,
                            mainimage : creatives.creativedetail[0].mainimage,
                            w:creatives.creativedetail[0].w,
                            h:creatives.creativedetail[0].h,
                            dur:creatives.creativedetail[0].dur,
                            protocol:creatives.creativedetail[0].protocol,
                            rating :creatives.creativedetail[0].rating,
                            calltoaction :creatives.creativedetail[0].calltoaction,
                            heading :creatives.creativedetail[0].heading,
                            description :creatives.creativedetail[0].description,
                            spons :creatives.creativedetail[0].spons,
                            icon:creatives.creativedetail[0].icon,
                            iconw :creatives.creativedetail[0].iconw,
                            iconh :creatives.creativedetail[0].iconh,
                            
                            //Audience details
        
                            audience : campaign.audience
                            };
        
                         //   console.log('datatoins',datatoIns);
                         // arrayCampaignConfig.push(datatoIns);
                            Campaignconfig.create(datatoIns).then(_c=>{
                         console.log('Config Created / Upated / Modified')
                      }) 
                     
                    // }).catch(err=> console.log(err));
        
                       });
        
                    
                    })
                 
                    });
                   
        
                  }) 
        
              });
        
        
        //  return res.send('okoooo')
        return 'ok';
        
            }).catch(err => res.serverError(err));
    }).catch(err=> console.log(err));

  },

  create: async function (req, res) {
    var arrayCampaignConfig = new Array();
    var datatoIns;

    Campaignconfig.destroy({}).then(_configd=>{
              console.log('removing old one');

    }).catch(err=> console.log(err));
            
              

    Campaign.find({status:'Active'}).then(_campaigns=>{
        console.log('We have ',_campaigns.length,' Active Campaigns to validate')
      // fetch all campaign and loop thru
      _campaigns.forEach(campaign => {
        // fetch all associated creatives for each campaign
        //  console.log('for each campaign id:',campaign.id);
          Campaigncreative.find({campaignid : campaign.id}).then(_campcreative=>{
            //fetch creative and creative details
         //   console.log('avaiale creative:',_campcreative)
            _campcreative.forEach(forcreatives => {
         //     console.log('for each creative id: ',forcreatives.creativeid);
              Creative.find({id:forcreatives.creativeid}).populate('creativedetail').then(crt=>{
                // console.log('creative',creatives);
               //console.log('_campcreative:',forcreatives.creativeid,creatives);

               crt.forEach(creatives => {
                //  // creatives.id,
                datatoIns={
                      campaignid : campaign.id,
                      name  :     campaign.name ,
                      stdate :     campaign.stdate,
                      eddate :     campaign.eddate,
                      tbudget  :     campaign.tbudget ,
                      dbudget  :     campaign.dbudget ,
                      timp   :     campaign.timp  ,
                      dimp   :     campaign.dimp  ,
                      // bid :     campaign.bid,
                      // minbid: minbid,
                      // maxbid: maxbid,
                      // pmpid: pmpid,
                      // timeZone: timeZone,
                    
                    // Geo Targetting :   // Geo Targetting,
                    country  :   campaign.country ,
                    countryOption  :   campaign.countryOption ,
                    city  :   campaign.city ,
                    cityOption  :   campaign.cityOption ,
                    
                    //device targetting :   //device targetting,
                    os  :   campaign.os ,
                    osOption  :   campaign.osOption ,
                    browser  :   campaign.browser ,
                    browserOption  :   campaign.browserOption ,
                    
                    //traffic :   //traffic,
                    trafficSource  :   campaign.trafficSource ,
                    iabCategory  :   campaign.iabCategory ,
                    iabCategoryOption  :   campaign.iabCategoryOption ,
                    exchange  :   campaign.exchange ,
                    
                    //carrier :   //carrier,
                    isp  :   campaign.isp ,
                    ispOption  :   campaign.ispOption ,
                    connectivity  :   campaign.connectivity ,
                    
                    //traffic optimize :   //traffic optimize,
                    
                    frequency  :   campaign.frequency ,
                    optimizeBy  :   campaign.optimizeBy ,
                    retargetting  :   campaign.retargetting ,
                    
                    status : campaign.status,
                    trafficStatus : campaign.trafficStatus,
                    remarks : campaign.remarks,
      
                    // creative 
                    creativeid : creatives.id,
                    creativename : creatives.name,
                    creativeType : creatives.creativeType,
                    advdomain : creatives.advdomain,
                    lp : creatives.lp,
                    imp : creatives.imp,
                    click : creatives.click,
      
                    // creative details
                    creativedetailsid : creatives.creativedetail[0].id,
                    iabsize : creatives.creativedetail[0].iabsize,
                    adtag : creatives.creativedetail[0].adtag,
                    mainimage : creatives.creativedetail[0].mainimage,
                    w:creatives.creativedetail[0].w,
                    h:creatives.creativedetail[0].h,
                    dur:creatives.creativedetail[0].dur,
                    protocol:creatives.creativedetail[0].protocol,
                    rating :creatives.creativedetail[0].rating,
                    calltoaction :creatives.creativedetail[0].calltoaction,
                    heading :creatives.creativedetail[0].heading,
                    description :creatives.creativedetail[0].description,
                    spons :creatives.creativedetail[0].spons,
                    icon:creatives.creativedetail[0].icon,
                    iconw :creatives.creativedetail[0].iconw,
                    iconh :creatives.creativedetail[0].iconh,
                    
                    //Audience details

                    audience : campaign.audience
                    };

                 //   console.log('datatoins',datatoIns);
                 // arrayCampaignConfig.push(datatoIns);
                    Campaignconfig.create(datatoIns).then(_c=>{
                 console.log('Config Created / Upated / Modified')
              }) 
             
            // }).catch(err=> console.log(err));

               });

            
            })
         
            });
           

          }) 

      });


  return res.send('okoooo')
//return 'ok';

    }).catch(err => res.serverError(err));
 
  },
  /**
   * `CampaignconfigController.findAll()`
   */
  findAll_cron: async function (req, res) {

    Campaignconfig.find().then(t=>{
      redisClient.set('RediscampaignConfig',JSON.stringify(t));
      redisClient.get("RediscampaignConfig", function (err, _congig) {
        if (err) return res.serverError(err);
        // return res.ok(_congig)
        return 'Updated to redis';
      });
    }).catch(err=> res.serverError(err));
  },

    findAll: async function (req, res) {

      Campaignconfig.find().then(t=>{
        redisClient.set('RediscampaignConfig',JSON.stringify(t));
        redisClient.get("RediscampaignConfig", function (err, _congig) {
          if (err) return res.serverError(err);
           return res.ok(_congig)
         // return 'Updated to redis';
        });
      }).catch(err=> res.serverError(err));

  },

  campaign_capping : async function(req,res){
    //this method runs via cron or can be attached to a route
    //it will check for capping, start date - end date, day parting
    //based on that it will update the traffic status
    //On a highlevel we have three scenarios
    //1) Update the status to inActive if the campaign is expried.
    //2) update the traffic status to pasued if cap is exceeded or based on dayparting or future campaign
    //3) update the traffic status to Active if cap is not exceeded or based on daypartting or current campaign
    

    //1) Update the status to inActive if the campaign is expried.
    let curdate = moment().subtract(1, 'days');
    let hr = new Date().getHours();
    let mins = new Date().getMinutes();
    let totalmins = hr*60 + mins;
    console.log('Current date is - ', totalmins);
    Campaign.find({status:'Active'}).populate("user").then(_campaigns=>{
      if(_campaigns.length > 0){
        _campaigns.forEach(campaign => {
          let st = moment(campaign.stdate),
              ed = moment(campaign.eddate),
              startTime = campaign.startTime,
              endTime = campaign.endTime,
              status=campaign.status,
              trafficStatus=campaign.trafficStatus,
              timp = parseInt(campaign.timp),
              dimp = parseInt(campaign.dimp),
              mis_timp = parseInt(campaign.mis_timp),
              mis_dimp = parseInt(campaign.mis_dimp),
              toUpdate = false,
              st_hr = parseInt(startTime.split(':')[0]*60) + parseInt(startTime.split(':')[1]),
              ed_hr = parseInt(endTime.split(':')[0]*60) + parseInt(endTime.split(':')[1]);
          //if(ed < curdate){
          if( curdate > ed){  
            console.log('This campaign is expired campaign - ',campaign.name);
            status='In-Active';
            trafficStatus='Pause';
            toUpdate = true;
            var data = {
              email : campaign.user.email,
              message: 'Campaign completed ' + campaign.name ,
              startDate:  moment(campaign.eddate).toDate(),
              campEnd: true
          }
          EmailController.sendMailCron(data);

          } else if(st > curdate && trafficStatus !== 'Pause'){
            console.log('This campaign is future campaign - ',campaign.name);
            status='Active';
            trafficStatus='Pause';
            toUpdate = true;
          } else if(st_hr < totalmins && ed_hr < totalmins && trafficStatus !== 'Pause'){ 
            console.log('This campaign is doesnot fall under dayparting - ',campaign.name);
            console.log(' Curtime, startTime,EndTime - ',campaign.startTime,campaign.endTime);
            status='Active';
            trafficStatus='Pause';
            toUpdate = true;
          } else if(st <= curdate && st_hr < totalmins && ed_hr > totalmins && trafficStatus === 'Pause'){ 
            console.log('This campaign is fall under dayparting Update - Make TrafficStatus Active- ',campaign.name);
            console.log(' Curtime, startTime,EndTime - ',campaign.startTime,campaign.endTime);
            status='Active';
            trafficStatus='Active';
            toUpdate = true;
          }else {
            console.log('This campaign is an active campaign - ',campaign.name);
          }

          let totalExeceed = false;
          if(mis_dimp || mis_timp){
            if(timp > 0 && mis_timp > 0){
              if( mis_timp >=timp){
                trafficStatus='Pause';
                status='In-Active';
                totalExeceed = true;
                console.log('Total Impression Capping exceed - ',campaign.name);
                var data = {
                  email : campaign.user.email,
                  message: 'Campaign completed - Total Impression Capping exceed ' + campaign.name ,
                  startDate:  moment(campaign.eddate).toDate(),
                  campEnd: true
              }
              EmailController.sendMailCron(data);
    
              } else {
                trafficStatus='Active';
              }
              toUpdate = true;
            } 
            if(dimp > 0 && mis_dimp > 0 && !totalExeceed){
              if(mis_dimp >= dimp){
                trafficStatus='Pause';
                console.log('Daily Impression Capping exceed - ',campaign.name);
              }else{
                trafficStatus='Active';
              }
              toUpdate = true;
            }
           
          }
          if(toUpdate){
            Campaign.update({id:campaign.id},{
              status:status,
              trafficStatus : trafficStatus
            }).catch(err=> console.log(err));
          }

        });
        

      }
      return '1st scenario completed';
    }).catch(err=> res.serverError(err));


  }

};

