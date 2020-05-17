/* eslint-disable one-var */
/**
 * CampaignController
 *
 * @description :: Server-side actions for handling incoming requests for Create, Update, Find and Get Campaign information.
 *                 Uses Mongo Database to store , Update , Delete and retrieve Campaign Information.
 * @Database :: Mongo
 * @model :: Campaign - Holds campaign information
 *           campaigncreative - holds campaign and creative mapping.
 *
 */
const axios = require('axios');
var rp = require('request-promise');
module.exports = {


  /**
   * `CampaignController.create()`
   * @description ::Receives request from Front end, Validates required params and Create a campaign by inserting a record to Dataase.
   * @param :: Request Parameters - Campaign Name, Start Date,End Date, Total Budget, Daily Budget, Total Impression
   *           Daily Impression, Bidding Price, Targetting Paramters like Country, City, Os, Browser, Device, Category , Excahnge.
   * @returns :: On Success,returns created campaign info
   *             On Failure, returns related Error Message
   */
  create: async function (req, res) {
    let name = req.param('name'),
      stdate = req.param('stdate'),
      eddate = req.param('eddate'),
      tbudget = req.param('tbudget'),
      dbudget = req.param('dbudget'),
      timp = req.param('timp'),
      dimp = req.param('dimp'),
      minbid = req.param('minbid'),
      maxbid = req.param('maxbid'),
      pmpid = req.param('pmpid'),
      currency = req.param('currency'),
      startTime = req.param('startTime'),
      endTime = req.param('endTime'),
      timeZone = req.param('timeZone'),
      // Geo Targetting
      country = req.param('country'),
      countryOption = req.param('countryOption'),
      city = req.param('city'),
      cityOption = req.param('cityOption'),

      //device targetting
      os = req.param('os'),
      osOption = req.param('osOption'),
      browser = req.param('browser'),
      browserOption = req.param('browserOption'),

      //traffic
      trafficSource = req.param('trafficSource'),
      iabCategory = req.param('iabCategory'),
      iabCategoryOption = req.param('iabCategoryOption'),
      exchange = req.param('exchange'),

      //carrier
      isp = req.param('isp'),
      ispOption = req.param('ispOption'),
      connectivity = req.param('connectivity'),

      //traffic optimize

      frequency = req.param('frequency'),
      optimizeBy = req.param('optimizeBy'),
      retargetting = req.param('retargetting'),
      user = req.param('user'),
      status = 'Pending',
      trafficStatus = req.param('trafficStatus'),
      remarks = 'Waiting for Approval';

    // validation
    if (!name) { return res.badRequest({ error: 'Missing Credentials' }); }
    if (!stdate) { return res.badRequest({ error: 'Missing Credentials' }); }
    if (!minbid) {minbid=.01 }
    if (!maxbid) { maxbid= .01 }
    if (!tbudget) { return res.badRequest({ error: 'Missing Credentials' }); }
    if (!dbudget) { dbudget = tbudget; }
    if (!country) { country = "ALL"; }
    if (!city) { city = "ALL"; }
    if (!os) { os = "ALL"; }
    if (!browser) { browser = "ALL"; }
    if (!iabCategory) { iabCategory = "ALL"; }
    if (!isp) { isp = "ALL"; }
    if (!trafficSource) { trafficSource = "ALL"; }
    if (!exchange) { exchange = "ALL"; }
    if (!connectivity) { connectivity = "ALL"; }
    if (!pmpid) { pmpid = "NA"; }
    if (!eddate) { eddate = stdate; }
    if (!countryOption) { countryOption = 'include'; }
    if (!cityOption) { cityOption = 'include'; }
    if (!osOption) { osOption = 'include'; }
    if (!browserOption) { browserOption = 'include'; }
    if (!iabCategoryOption) { iabCategoryOption = 'include'; }
    if (!ispOption) { ispOption = 'include'; }
    if (!timeZone) { timeZone = 'NA'; }

    Campaign.find({ name: name }).then(camp => {
      console.log(camp);
      if (camp.length === 0) {
        Campaign.create({
          name: name,
          stdate: stdate,
          eddate: eddate,
          tbudget: tbudget,
          dbudget: dbudget,
          timp: timp,
          dimp: dimp,
          pmpid: pmpid,
          minbid: minbid,
          maxbid: maxbid,
          currency:currency,
          startTime: startTime,
          endTime: endTime,
          timeZone:timeZone,
          // Geo Targetting :   // Geo Targetting,
          country: country,
          countryOption: countryOption,
          city: city,
          cityOption: cityOption,
    
          //device targetting :   //device targetting,
          os: os,
          osOption: osOption,
          browser: browser,
          browserOption: browserOption,
    
          //traffic :   //traffic,
          trafficSource: trafficSource,
          iabCategory: iabCategory,
          iabCategoryOption: iabCategoryOption,
          exchange: exchange,
    
          //carrier :   //carrier,
          isp: isp,
          ispOption: ispOption,
          connectivity: connectivity,
    
          //traffic optimize :   //traffic optimize,
    
          frequency: frequency,
          optimizeBy: optimizeBy,
          retargetting: retargetting,
    
          status: status,
          trafficStatus: trafficStatus,
          remarks: remarks,
          user:user
    
    
        }).fetch().then(_campaign => {
    
          Campaign_mapping.create({
            id: _campaign.id,
            campaignid : _campaign.id,
            campaignname : name
          }).then(_p=>{
            console.log('Complted postgress DB for campaign created');
            // Create a new payload
            let camp_data = {
              id:_campaign.id,
              campaignid:_campaign.id,  
              campaignname:_campaign.name,
              createdAt:_campaign.createdAt,
              updatedAt:_campaign.updatedAt
            }
            const record = [{
              topic: "dsp_campaign_mapping",
              messages: JSON.stringify(camp_data),
              attributes: 1 /* Use GZip compression for the payload */
            }];
    
            //{ "id": "260", "campaignid" : "1234", "campaignname":"abcd" , "createdAt":"", "updatedAt": "1" }
            // /curl -XPOST "http://172.16.2.26:9200/camapign_mapping/campaign" -H 'Content-Type: application/json' -d'
            // {
            //   id:_campaign.id,
            //   campaignid:_campaign.id,  
            //   campaignname:_campaign.name,
            //   createdAt:_campaign.createdAt,
            //   updatedAt:_campaign.updatedAt
            // }
            let options = {
              method : 'POST',
              uri : sails.config.elasticUrl + '/campaign_mapping/campaign',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(camp_data )
              
            }
            rp(options).then((aggregateData) => {
              console.log(aggregateData)
              kfkproducer.send(record, function (err, data) {
                if (err) {
                  console.log('error', err);
                }
                console.log(data);
              });
              return res.ok(_campaign);
            });
    
           
          }).catch(err => res.serverError(err.message));
        }).catch(err => res.serverError(err.message));
    
    
      }else {
        return res.serverError({ message: 'Campaign Name Already Exist' });
      }
    }).catch(err => res.serverError(err.message));
    // Insert to database

  },

  /**
   * `CampaignController.findAll()`
   * @description ::Receives request from Front end to fetch all the campaign information.
   * @returns :: On Success,returns All available campaign info
   *             On Failure, Record not found
   */
  findAll: async function (req, res) {
    //Fetch records from database
    Campaign.find().then(_campaigns => {
      // if (!_campaigns || _campaigns.length === 0) {
      //   throw new Error('Record not found');
      // }
      //console.log(_campaigns[0].name);
      return res.ok(_campaigns);

    }).catch(err => res.serverError(err.message));
  },


  /**
   * `CampaignController.countryfindAll()`
   * @description ::Receives request from Front end to fetch all the country information.
   * @returns :: On Success,returns All available country info
   *             On Failure, Record not found
   */
    countryfindAll : async function (req, res) {
    //Fetch records from database
    Countrymaster.find().then(country => {
      if (!country || country.length === 0) {
        throw new Error('Record not found');
      }
      //console.log(_campaigns[0].name);
      return res.ok(country);

    }).catch(err => res.serverError(err.message));
  },

  /**
 * `CampaignController.findAllPending()`
   * @description ::Receives request from Front end to fetch all Pending campaign for approval.
   * @returns :: On Success,returns All available campaign info which are not approved [status != Acttive]
   *             On Failure, Record not found
 */
  findAllPending: async function (req, res) {
    //Fetch records from database matching [status != Acttive]
    let finalcampaign=[];
    Campaigncreative.find().then(_campaigns => {
      _campaigns.forEach(c => {
        finalcampaign.push(c.campaignid);
      });
      console.log(finalcampaign);
      Campaign.find({ where: { status: { '!=': ['Active','In-Active'] },id:finalcampaign, } }).populate('user').then(_campaigns => {
        // if (!_campaigns || _campaigns.length === 0) {
        //   throw new Error('Record not found');
        // }
        // console.log(_campaigns.name)
        return res.ok(_campaigns);
  
  
      }).catch(err => res.serverError(err.message));
    });


  },

  /**
   * `CampaignController.updateStatus()`
   * @description ::Receives request from Front end to update the campaign Status.
   * @param :: id "Campaign id for which status to be updated"
   * @returns :: On Success,returns Message Campaign Updated with status
   */

  updateStatus: async function (req, res) {
    console.log('Campaign update request');
    let id = req.param('id');
    // validation
    if (!id) { return res.badRequest({ error: 'Missing Credentials' }); }
    Campaign.update({ id: id }, {
      status: req.param('status'),
      remarks: req.param('remarks')
    }).then(_data => {
      CampConfigUrl = "http://localhost:1337/config";
      axios.post(CampConfigUrl, {
        todo: 'Buy the milk'
      })
      .then((res) => {
        console.log(res.data);
        axios.get(CampConfigUrl);
      })
      .catch((error) => {
        console.error(error)
      });

      return res.ok('Campaign Updated with status');
      //update campaign config on update status



    }).catch(err => res.serverError(err.message));
  },


  /**
   * `CampaignController.findOne()`
   * @description ::Receives request from Front end to fetch the campaign Information.
   * @Param ::  id "Campaign id for information is requested"
   * @returns :: Campaign information if exist else Record not found.
   * @Note :: it will be implemented when ever it required
   */
  findOne: async function (req, res) {
    return res.json({
      todo: 'findOne() is not implemented yet!'
    });
  },

  /**
  * `CampaignController.campaigncreative()`
   * @description ::Receives request from Front end to map creatives with Campaign .
   * @Param ::  campId , creativeids "Campaign id & Array of creative id for which Creative to be mapped with campaign"
   * @returns :: on Success return "OK"
   *             on Failure retruns with relavent error message
   */
  campaigncreative: async function (req, res) {
    let campId = req.param('campaignid'),
      creativeids = req.param('creativeid');
    // console.log(campId,creativeids);
    Campaigncreative.destroy({ campaignid: campId,creativeid : creativeids }).then(_c => {
      creativeids.forEach(creativeid => {
        Campaigncreative.create({
          campaignid: campId,
          creativeid: creativeid
        }).fetch().then(_cid => {

        });
      });

      return res.ok('ok');
    }).catch(err => res.serverError(err));

  },

  /**
  * `CampaignController.getcampaigncreative()`
   * @description ::Receives request from Front end for creatives mapped to a Campaign .
   * @Param ::  id "Campaign id for which Creatives mapped with campaign"
   * @returns :: on Success return Creative Information
   *             on Failure retruns with relavent error message
   */
  getcampaigncreative: async function (req, res) {
    //get campaign creatives
    let campId = req.param('id');

    let finalcreative = [];
    Campaigncreative.find({ campaignid: campId }).then(_campaigns => {
      _campaigns.forEach(c => {
        finalcreative.push(c.creativeid);
      });

      Creative.find({ id: finalcreative }).populate('creativedetail').then(_creative => {
        //console.log(_creative);
        return res.ok(_creative);
      }).catch(err => res.serverError(err.message));

    }).catch(err => res.serverError(err.message));
  },


  /**
  * `CampaignController.Updatecampaigncreative()`
   * @description ::Receives request from Front end to update creatives with Campaign .
   * @Param ::  campId , creativeids "Campaign id & Array of creative id for which Creative to be mapped with campaign"
   * @returns :: on Success return "OK"
   *             on Failure retruns with relavent error message
   */
  Updatecampaigncreative: async function (req, res) {
    let campId = req.param('campaignid'),
      creatid = req.param('creativeid');
    console.log(campId, creatid);
    //return res.ok('ok');

    Campaigncreative.destroy({ campaignid: campId, creativeid: creatid }).then(_c => {
      // console.log(_c);
      return res.ok('ok');
    }).catch(err => res.serverError(err));

  },

  /**
   * `CampaignController.delete()`
   * @description ::Receives request from Front end to Delete a Campaign .
   * @Param ::  id  "Campaign id to be deleted in Database"
   * @returns :: on Success return "Campaign is deleted with id xyz"
   *             on Failure retruns with relavent error message
   */
  delete: async function (req, res) {
    let postId = req.params.id;

    if (!postId) { return res.badRequest({ err: 'missing Campaign Id field' }); }

    Campaign.destroy({ id: postId })
      .fetch()
      .then(_post => {
        if (!_post || _post.length === 0) { return res.notFound({ err: 'No Campaign found in our record' });}
        Campaign_mapping.destroy({ id: postId}).then(_p=>{
          console.log('Complted postgress DB for campaign deleted');
          return res.ok(`Campaign is deleted with id ${postId}`);
        }).catch(err => res.serverError(err.message));
       
      })
      .catch(err => res.serverError(err));


  },

  /**
   * `CampaignController.update()`
   * @description ::Receives request from Front end to Update a Campaign .
   * @Param ::  id  "Campaign id to be deleted in Database"
   * @returns :: on Success return "Campaign Details Updated for xyz"
   *             on Failure retruns with relavent error message
   */
  update: async function (req, res) {

    let name = req.param('name'),
      stdate = req.param('stdate'),
      eddate = req.param('eddate'),
      tbudget = req.param('tbudget'),
      dbudget = req.param('dbudget'),
      timp = req.param('timp'),
      dimp = req.param('dimp'),
      minbid = req.param('minbid'),
      maxbid = req.param('maxbid'),
      pmpid = req.param('pmpid'),
      startTime = req.param('startTime'),
      endTime = req.param('endTime'),
      timeZone = req.param('timeZone'),
      // Geo Targetting
      country = req.param('country'),
      countryOption = req.param('countryOption'),
      city = req.param('city'),
      cityOption = req.param('cityOption'),

      //device targetting
      os = req.param('os'),
      osOption = req.param('osOption'),
      browser = req.param('browser'),
      browserOption = req.param('browserOption'),

      //traffic
      trafficSource = req.param('trafficSource'),
      iabCategory = req.param('iabCategory'),
      iabCategoryOption = req.param('iabCategoryOption'),
      exchange = req.param('exchange'),

      //carrier
      isp = req.param('isp'),
      ispOption = req.param('ispOption'),
      connectivity = req.param('connectivity'),

      //traffic optimize

      frequency = req.param('frequency'),
      optimizeBy = req.param('optimizeBy'),
      retargetting = req.param('retargetting'),

      status = 'Pending',
      trafficStatus = req.param('trafficStatus'),
      remarks = 'Waiting for Approval',

      campId = req.param('id');

    // validation
    if (!name) { return res.badRequest({ error: 'Missing Credentials' }); }
    if (!stdate) { return res.badRequest({ error: 'Missing Credentials' }); }
    // if (!minbid) { return res.badRequest({ error: 'Missing Credentials' }); }
    // if (!maxbid) { return res.badRequest({ error: 'Missing Credentials' }); }
    if (!tbudget) { return res.badRequest({ error: 'Missing Credentials' }); }
    if (!dbudget) { dbudget = tbudget; }
    if (!country) { country = "ALL"; }
    if (!city) { city = "ALL"; }
    if (!os) { os = "ALL"; }
    if (!browser) { browser = "ALL"; }
    if (!iabCategory) { iabCategory = "ALL"; }
    if (!isp) { isp = "ALL"; }
    if (!trafficSource) { trafficSource = "ALL"; }
    if (!exchange) { exchange = "ALL"; }
    if (!connectivity) { connectivity = "ALL"; }
    if (!pmpid) { pmpid = "NA"; }
    if (!timeZone) { timeZone = "NA"; }
    if (!eddate) { eddate = stdate; }
    if (!countryOption) { countryOption = 'include'; }
    if (!cityOption) { cityOption = 'include'; }
    if (!osOption) { osOption = 'include'; }
    if (!browserOption) { browserOption = 'include'; }
    if (!iabCategoryOption) { iabCategoryOption = 'include'; }
    if (!ispOption) { ispOption = 'include'; }

    if(trafficStatus === 'Pause') { status = 'In-Active'; }


    Campaign.find({ name: name }).then(camp => {
      console.log(camp);
      if (camp.length === 0 || camp[0].id === campId) {
        Campaign.update({ id: campId }, {
          name: name,
          stdate: stdate,
          eddate: eddate,
          tbudget: tbudget,
          dbudget: dbudget,
          timp: timp,
          dimp: dimp,
          minbid: minbid,
          maxbid: maxbid,
          pmpid: pmpid,
          startTime: startTime,
          endTime: endTime,
          timeZone:timeZone,
          // Geo Targetting :   // Geo Targetting,
          country: country,
          countryOption: countryOption,
          city: city,
          cityOption: cityOption,
    
          //device targetting :   //device targetting,
          os: os,
          osOption: osOption,
          browser: browser,
          browserOption: browserOption,
    
          //traffic :   //traffic,
          trafficSource: trafficSource,
          iabCategory: iabCategory,
          iabCategoryOption: iabCategoryOption,
          exchange: exchange,
    
          //carrier :   //carrier,
          isp: isp,
          ispOption: ispOption,
          connectivity: connectivity,
    
          //traffic optimize :   //traffic optimize,
    
          frequency: frequency,
          optimizeBy: optimizeBy,
          retargetting: retargetting,
    
          status: status,
          trafficStatus: trafficStatus,
          remarks: remarks
    
    
        }).then(_campaign => {
    
          //return res.ok(_campaign);
          //console.log (_campaign);
          Campaign_mapping.update({id: campId},{
            campname : name,
          }).then(_p=>{
            console.log('updated postgress DB for Campaign update');
          }).catch(err => res.serverError(err.message));
    
          return res.ok({ message: 'Campaign Details Updated..' + campId });
    
        }).catch(err => res.serverError(err));
      }else {
        return res.serverError({ message: 'Campaign Name Already Exist' });
      }
    }).catch(err => res.serverError(err.message));


  }

};

