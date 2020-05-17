
var moment = require('moment');
var rp = require('request-promise');

module.exports = {
    fetchdashboardcard : fetchdashboardcard, 
    fetchCampWiseData : fetchCampWiseData,
    fetchIntercativeEl : fetchIntercativeEl,
    fetchPubWiseData : fetchPubWiseData,
    fetchBrowserData : fetchBrowserData,
    fetchPlatfromData : fetchPlatfromData,
    fetchRefererData : fetchRefererData,
    fetchDomainData : fetchDomainData,
    fetchVideoViewsData : fetchVideoViewsData,
    fetchCountryWiseData : fetchCountryWiseData,
    fetchDaywiseImpData : fetchDaywiseImpData,
    fetchImpressionCron : fetchImpressionCron,
    fetchCampaignList : fetchCampaignList,
    fetchPubList : fetchPubList,
    ABRData : ABRData,
    updateCamp : updateCamp,
    updatePub : updatePub,
    fetchPlatfromDataDaywise : fetchPlatfromDataDaywise,
    fetchCountryData : fetchCountryData
}

// for creating object using videoData

var concatVideoId = function (videoData) {
    // console.log('videoData',videoData)
    var newArr = [];
    var conctString = '';
    if(videoData.length){
      for(var i =0 ;i<videoData.length;i++){
        conctString = conctString.concat("'"+videoData[i].value+"'"+',')
      }
      conctString = conctString.substring(0,conctString.length-1)
      // console.log('concat','('+conctString+')')
      return '('+conctString+')';
    }
  }

  var concatPltFilters = function (filters) {
    console.log('filters',filters)
    var fullFilterString = '';
    if(filters){
        for(var filt in filters){
          var conctString = '';
          for(var i =0 ;i<filters[filt].length;i++){
            if(filters[filt][i].check == 'true'){
              conctString = conctString.concat("'"+filters[filt][i].label+"'"+',')
            }        
          }
          conctString = conctString.substring(0,conctString.length-1);
          if(conctString!=''){
            fullFilterString = fullFilterString.concat(' AND '+filt+' in ('+conctString+')')
          }      
        }
        console.log('full string'+fullFilterString);
        return fullFilterString;
      }else{
        return '';
      } 
  }

  //Modify date format for ES Query
  function modifyDateFormat(dt,delimiter){
    if(!delimiter){
      delimiter='-';
    }
    let dtnew = new Date(dt.split(delimiter).reverse().join('/')).getTime(); 
    if(!dtnew){
      dtnew = moment(dt).format('L');
      dtnew = new Date(dtnew).getTime();
    }
    if(!dtnew){
      dtnew = new Date(dt).getTime();
    }
    return dtnew;
  }

// to get DSP dashboard card details (Impression , views  , unique views)
 async function fetchdashboardcard(req,res){
    console.log(req.isAuthenticated());
    var startDate = modifyDateFormat(req.body.date.startDate);
    var endDate = modifyDateFormat(req.body.date.endDate);
    endDate = endDate + 86400000;
    var videoShould = [];
    var partnerShould = [];
    if(req.body.videoid && req.body.videoid.length>0) {
      req.body.videoid.forEach(videoid => {
        videoShould.push({"match_phrase": {"campaignname": videoid.label}})  
      });
    } 
    if(req.body.partnerId && req.body.partnerId.length>0) {
      req.body.partnerId.forEach(partner => {
        partnerShould.push({"match_phrase": {"pubname": partner.label}});  
      });
    }
  

    //let video_label = 'Discovery Sports';
  let options = {
    method : 'GET',
    uri : sails.config.elasticUrl + '/video-*/_search?pretty',
    json: true,
    body: {
      "aggs": {
        "imp": {
          "cardinality": {
            "field": "impid.keyword"
          }
        },
        "total_views": {
          "cardinality": {
            "field": "viewid.keyword"
          }
        },
        "unique_views": {
          "cardinality": {
            "field": "sessionid.keyword"
          }
        }
      },
      "size": 0,
      "_source": {
        "excludes": []
      },
      "stored_fields": [
        "*"
      ],
      "script_fields": {},
      "docvalue_fields": [
        {
          "field": "curdate",
          "format": "date_time"
        },
        {
          "field": "curdatetime",
          "format": "date_time"
        },
        {
          "field": "timestamp",
          "format": "date_time"
        }
      ],
      "query": {
        "bool": {
          "must": [
            {
              "bool": {
                "minimum_should_match": 1,
                "should": videoShould
              },
            },
            {
              "bool": {
                "minimum_should_match": 1,
                "should": partnerShould
              }
            },
            {
              "match_all": {}
            },
            {
              "match_all": {}
            },
            {
              "range": {
                "timestampGMT": {
                  "gte": startDate,
                  "lte": endDate,
                  "format": "epoch_millis"
                }
              }
            },
            {
              "bool": {
                "should": [
                  {
                    "match_phrase": {
                      "_type": "impression"
                    }
                  },
                  {
                    "match_phrase": {
                      "_type": "pageview"
                    }
                  }
                ],
                "minimum_should_match": 1
              }
            },
          ],
          "should": [],
          "must_not": []
        }
      }
    }
  }
  let result =  [];
  rp(options).then((aggregateData) => {
    if(aggregateData.aggregations){
      result = aggregateData.aggregations;
      res.status(200).json({Status: "success", data: result});
    }else{
      res.status(202).json({Status: "success", data: []});
    }
  }).catch((error) => {
    res.status(500).json({Status: "Failure", result: error});
  })
 }

 // to fetch campaign wise impression data 
 function fetchCampWiseData(req,res){
  var startDate = modifyDateFormat(req.body.date.startDate);
  var endDate = modifyDateFormat(req.body.date.endDate);
  endDate = endDate + 86400000;

  //let video_label = 'Discovery Sports';
  let options = {
    method : 'GET',
    uri : sails.config.elasticUrl +'/video*/_search?pretty',
    json: true,
    body: {
      "aggs": {
        "data": {
          "date_histogram": {
            "field": "timestamp",
            "interval": "1d",
            "time_zone": "Asia/Kolkata",
            "min_doc_count": 1
          },
          "aggs": {
            "data": {
              "terms": {
                "field": "campaignname.keyword",
                "size": 5,
                "order": {
                  "1": "desc"
                }
              },
              "aggs": {
                "1": {
                  "cardinality": {
                    "field": "impid.keyword"
                  }
                },
                "2": {
                  "cardinality": {
                    "field": "viewid.keyword"
                  }
                },
                "3": {
                  "cardinality": {
                    "field": "sessionid.keyword"
                  }
                }
              }
            }
          }
        }
      },
      "size": 0,
      "_source": {
        "excludes": []
      },
      "stored_fields": ["*"],
      "script_fields": {},
      "docvalue_fields": [{
        "field": "curdate",
        "format": "date_time"
      }, {
        "field": "curdatetime",
        "format": "date_time"
      }, {
        "field": "timestamp",
        "format": "date_time"
      }],
      "query": {
        "bool": {
          "must": [{
            "bool": {
              "minimum_should_match": 1,
              "should": [{
                "match_phrase": {
                  "_type": "impression"
                }
              }, {
                "match_phrase": {
                  "_type": "pageview"
                }
              }]
            }
          }, {
            "range": {
              "timestamp": {
                "gte": startDate,
                "lte": endDate,
                "format": "epoch_millis"
              }
            }
          }, {
            "bool": {
              "minimum_should_match": 1,
              "should": [{
                "match_phrase": {
                  "_type": "impression"
                }
              }, {
                "match_phrase": {
                  "_type": "pageview"
                }
              }]
            }
          }],
          "filter": [{
            "match_all": {}
          }, {
            "match_all": {}
          }],
          "should": [],
          "must_not": []
        }
      }
    }
  }
  let caresult =  [];
rp(options).then((aggregateData) => {
    if((aggregateData.aggregations && aggregateData.aggregations.data.buckets && aggregateData.aggregations.data.buckets.length)){
      aggregateData.aggregations.data.buckets.map((data, index) => {
        data.data['buckets'].map((data1, index) => {
          let obj = {
            date : moment(data.key_as_string).format('YYYY-MM-DD'),
            campaign_name : data1.key,
            imp: data1['1'].value,
            total_views: data1['2'].value,
            unique_views: data1['3'].value            
          }
          caresult.push(obj);
        })
      })
      res.json({data:caresult});
    }else{
      res.status(202).json({Status: "success", data: []});
    }
  }).catch((error) => {
    res.status(500).json({Status: "Failure", result: error});
  })
}


// to fetch campaign wise interactive element data
function fetchIntercativeEl(req,res){
   //let video_label = 'Discovery Sports';
   var startDate = modifyDateFormat(req.body.date.startDate);
   var endDate = modifyDateFormat(req.body.date.endDate);
   endDate = endDate + 86400000;

   let options = {
     method : 'GET',
     uri : sails.config.elasticUrl +'/video*/_search?pretty',
     body: {
       "aggs": {
         "data": {
           "date_histogram": {"field": "timestamp","interval": "1d","time_zone": "Asia/Kolkata","min_doc_count": 1},
           "aggs": {
             "bucket_data": {
               "terms": {"field": "interactivity_name.keyword","size": 5,"order": {"1": "desc"}},
               "aggs": {"1": {"cardinality": {"field": "intid.keyword"}}}
             }
           }
         }
       },
       "size": 0,
       "_source": {"excludes": []},
       "stored_fields": ["*"],
       "script_fields": {},
       "docvalue_fields": [
         {"field": "curdate","format": "date_time"},
         {"field": "curdatetime","format": "date_time"},
         {"field": "timestamp","format": "date_time"}
       ],
       "query": {
         "bool": {
           "must": [
             //{"bool": {"should": [{"match_phrase": {"title.keyword": video_label}}],"minimum_should_match": 1}},
             {"bool": {"filter": {"term": {"_type": "interactivity"}}}},
             {"range": {"timestamp": {"gte": startDate,"lte": endDate,"format": "epoch_millis"}}},
             {"bool": {"filter": {"term": {"_type": "interactivity"}}}}
           ],
           "filter": [
             {"match_all": {}},
             {"match_all": {}}
           ],
           "should": [],
           "must_not": []
         }
       }
     },
     json: true
   };
   let result = [];
   rp(options).then((aggregateData) => {
     if((aggregateData.aggregations && aggregateData.aggregations.data.buckets && aggregateData.aggregations.data.buckets.length)){
       aggregateData.aggregations.data.buckets.map((data, index) => {
         data.bucket_data['buckets'].map((data1, index) => {
           let obj = {
             date : moment(data.key_as_string).format('YYYY-MM-DD'),
             event_count : data1.doc_count.toString(),
             element: data1.key
           }
           result.push(obj);
         })
       })
       res.json(result);
     }else{
       res.status(202).json(result);
     }
   }).catch((error) => {
     res.status(500).json({Status: "Failure", result: error});
   })
}

// to fetch publisher wise campaign data
function fetchPubWiseData(req,res){

  var startDate = modifyDateFormat(req.body.date.startDate);
  var endDate = modifyDateFormat(req.body.date.endDate);
  endDate = endDate + 86400000;

  var videoShould = [];
  var partnerShould = [];
  if(req.body.videoid && req.body.videoid.length>0) {
    req.body.videoid.forEach(videoid => {
      videoShould.push({"match_phrase": {"campaignname": videoid.label}})  
    });
  } 
  if(req.body.partnerId && req.body.partnerId.length>0) {
    req.body.partnerId.forEach(partner => {
      partnerShould.push({"match_phrase": {"pubname": partner.label}});  
    });
  }

//let video_label = 'Discovery Sports';
let options = {
  method : 'GET',
  uri : sails.config.elasticUrl +'/video*/_search?pretty',
  json: true,
  body: {
    "aggs": {
      "data": {
        "date_histogram": {
          "field": "timestamp",
          "interval": "1d",
          "time_zone": "Asia/Kolkata",
          "min_doc_count": 1
        },
        "aggs": {
          "data": {
            "terms": {
              "field": "campaignname.keyword",
              "size": 5,
              "order": {
                "1": "desc"
              }
            },
            "aggs": {
              "1": {
                "cardinality": {
                  "field": "impid.keyword"
                }
              },
              "data": {
                "terms": {
                  "field": "pubname.keyword",
                  "size": 5,
                  "order": {
                    "1": "desc"
                  }
                },
                "aggs": {
                  "1": {
                    "cardinality": {
                      "field": "impid.keyword"
                    }
                  },
                  "3": {
                    "cardinality": {
                      "field": "viewid.keyword"
                    }
                  },
                  "5": {
                    "cardinality": {
                      "field": "sessionid.keyword"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "size": 0,
    "_source": {
      "excludes": []
    },
    "stored_fields": ["*"],
    "script_fields": {},
    "docvalue_fields": [{
      "field": "curdate",
      "format": "date_time"
    }, {
      "field": "curdatetime",
      "format": "date_time"
    }, {
      "field": "timestamp",
      "format": "date_time"
    }],
    "query": {
      "bool": {
        "must": [
          {
          "bool": {
            "minimum_should_match": 1,
            "should": [{
              "match_phrase": {
                "_type": "impression"
              }
            }, {
              "match_phrase": {
                "_type": "pageview"
              }
            }]
          }
        },
        {
          "bool": {
            "minimum_should_match": 1,
            "should": videoShould
          }
        },
        {
          "bool": {
            "minimum_should_match": 1,
            "should": partnerShould
          }
        }, 
        {
          "range": {
            "timestamp": {
              "gte": startDate,
              "lte": endDate,
              "format": "epoch_millis"
            }
          }
        }, {
          "bool": {
            "minimum_should_match": 1,
            "should": [{
              "match_phrase": {
                "_type": "impression"
              }
            }, {
              "match_phrase": {
                "_type": "pageview"
              }
            }]
          }
        }],
        "filter": [{
          "match_all": {}
        }, {
          "match_all": {}
        }],
        "should": [],
        "must_not": []
      }
    }
  }
}
let result =  [];
rp(options).then((aggregateData) => {
  if((aggregateData.aggregations && aggregateData.aggregations.data.buckets && aggregateData.aggregations.data.buckets.length)){
    aggregateData.aggregations.data.buckets.map((data, index) => {
      data.data['buckets'].map((data1, index) => {
        data1.data['buckets'].map((data2, index) => {
          let obj = {
            date : moment(data.key_as_string).format('YYYY-MM-DD'),
            campaign_name : data1.key,
            publisher : data2.key,
            imp: data2['1'].value,
            total_views: data2['3'].value,
            unique_views: data2['5'].value            
          }
          result.push(obj);
        })
       
      })
    })
    res.json({data:result});
  }else{
    res.status(202).json({Status: "success", data: []});
  }
}).catch((error) => {
  res.status(500).json({Status: "Failure", result: error});
})
}


// to fetch browser wise campaign data
function fetchBrowserData(req,res){
  var startDate = modifyDateFormat(req.body.date.startDate);
  var endDate = modifyDateFormat(req.body.date.endDate);
  endDate = endDate + 86400000;

  var videoShould = [];
  var partnerShould = [];
  if(req.body.videoid && req.body.videoid.length>0) {
    req.body.videoid.forEach(videoid => {
      videoShould.push({"match_phrase": {"campaignname": videoid.label}})  
    });
  } 
  if(req.body.partnerId && req.body.partnerId.length>0) {
    req.body.partnerId.forEach(partner => {
      partnerShould.push({"match_phrase": {"pubname": partner.label}});  
    });
  }

//let video_label = 'Discovery Sports';
let options = {
  method : 'GET',
  uri : sails.config.elasticUrl +'/video*/_search?pretty',
  json: true,
  body:{
    "aggs": {
      "data": {
        "date_histogram": {
          "field": "timestamp",
          "interval": "1d",
          "time_zone": "Asia/Kolkata",
          "min_doc_count": 1
        },
        "aggs": {
          "data": {
            "terms": {
              "field": "browser.keyword",
              "size": 5,
              "order": {
                "1": "desc"
              }
            },
            "aggs": {
              "1": {
                "cardinality": {
                  "field": "viewid.keyword"
                }
              }
            }
          }
        }
      }
    },
    "size": 0,
    "_source": {
      "excludes": []
    },
    "stored_fields": [
      "*"
    ],
    "script_fields": {},
    "docvalue_fields": [
      {
        "field": "curdate",
        "format": "date_time"
      },
      {
        "field": "curdatetime",
        "format": "date_time"
      },
      {
        "field": "timestamp",
        "format": "date_time"
      }
    ],
    "query": {
      "bool": {
        "must": [
          {
            "match_all": {}
          },
          {
            "match_all": {}
          },
          {
            "bool": {
              "minimum_should_match": 1,
              "should": videoShould
            }
          },
          {
            "bool": {
              "minimum_should_match": 1,
              "should": partnerShould
            }
          },
          {
            "bool": {
              "filter": [
                {
                  "term": {
                    "_type": "pageview"
                  }
                }
              ]
            }
          },
          {
            "range": {
              "timestamp": {
                "gte": startDate,
                "lte": endDate,
                "format": "epoch_millis"
              }
            }
          },
          {
            "bool": {
              "filter": [
                {
                  "term": {
                    "_type": "pageview"
                  }
                }
              ]
            }
          }
        ],
        "filter": [],
        "should": [],
        "must_not": []
      }
    }
  }
}
let brresult =  [];
rp(options).then((aggregateData) => {
  if((aggregateData.aggregations && aggregateData.aggregations.data.buckets && aggregateData.aggregations.data.buckets.length)){
    aggregateData.aggregations.data.buckets.map((data, index) => {
      data.data['buckets'].map((data1, index) => {
          let obj = {
            date : moment(data.key_as_string).format('YYYY-MM-DD'),
            browser : data1.key,
            a : data1.doc_count, 
          }
          brresult.push(obj);
      })
    })
    res.json({data:brresult});
  }else{
    res.status(202).json({Status: "success", data: []});
  }
}).catch((error) => {
  res.status(500).json({Status: "Failure", result: error});
})
}

// to fetch platform wise campaign data

function fetchPlatfromData(req,res){
  //let video_label = 'Discovery Sports';
  if(!req.body.date){
    return res.status(500).json({Status: "Failure"});
  }
  var startDate = modifyDateFormat(req.body.date.startDate);
  var endDate = modifyDateFormat(req.body.date.endDate);
  endDate = endDate + 86400000;

  var videoShould = [];
  var partnerShould = [];
  if(req.body.videoid && req.body.videoid.length>0) {
    req.body.videoid.forEach(videoid => {
      videoShould.push({"match_phrase": {"campaignname": videoid.label}})  
    });
  } 
  if(req.body.partnerId && req.body.partnerId.length>0) {
    req.body.partnerId.forEach(partner => {
      partnerShould.push({"match_phrase": {"pubname": partner.label}});  
    });
  }

  let options = {
    method : 'GET',
    uri : sails.config.elasticUrl +'/video-pageview*/_search?pretty',
    json: true,
    body: {
      "aggs": {
        "data": {
          "terms": {
            "field": "platform.keyword",
            "size": 5,
            "order": {
              "1": "desc"
            }
          },
          "aggs": {
            "1": {
              "cardinality": {
                "field": "viewid.keyword"
              }
            }
          }
        }
      },
      "size": 0,
      "_source": {
        "excludes": []
      },
      "stored_fields": ["*"],
      "script_fields": {},
      "docvalue_fields": [{
        "field": "time",
        "format": "date_time"
      }, {
        "field": "timestamp",
        "format": "date_time"
      }],
      "query": {
        "bool": {
          "must": [
           {
              "bool": {
                "minimum_should_match": 1,
                "should": videoShould
              }
            },
            {
              "bool": {
                "minimum_should_match": 1,
                "should": partnerShould
              }
            },
          {
            "range": {
              "timestampGMT": {
                "gte": startDate,
                "lte": endDate,
                "format": "epoch_millis"
              }
            }
          }],
          "filter": [{
            "match_all": {}
          }, {
            "match_all": {}
          }],
          "should": [],
          "must_not": []
        }
      }
    }
  }

  rp(options).then((aggregateData) => {
    if(aggregateData.aggregations){
      aggregateData.aggregations.data.buckets.map((data, index) => {
        data['platform'] = data.key.toUpperCase();
        data['count'] = data.doc_count.toString();
      })
      res.status(200).json({Status: "success", data: aggregateData.aggregations.data.buckets });
    }else{
      res.status(202).json({Status: "success", data: []});
    }
  }).catch((error) => {
    res.status(500).json({Status: "Failure", result: error});
  })
}

// to fetch referer wise campaign data

function fetchRefererData(req,res){
 // let video_label = 'Discovery Sports';
 var startDate = modifyDateFormat(req.body.date.startDate);
 var endDate = modifyDateFormat(req.body.date.endDate);
 endDate = endDate + 86400000;

  var videoShould = [];
  var partnerShould = [];
  if(req.body.videoid && req.body.videoid.length>0) {
    req.body.videoid.forEach(videoid => {
      videoShould.push({"match_phrase": {"campaignname": videoid.label}})  
    });
  } 
  if(req.body.partnerId && req.body.partnerId.length>0) {
    req.body.partnerId.forEach(partner => {
      partnerShould.push({"match_phrase": {"pubname": partner.label}});  
    });
  }
  let options = {
    method : 'GET',
    uri : sails.config.elasticUrl +'/video-impression*/_search?pretty',
    json: true,
    body: {
      "aggs": {
        "data": {
          "date_histogram": {
            "field": "timestamp",
            "interval": "1d",
            "time_zone": "Asia/Kolkata",
            "min_doc_count": 1
          },
          "aggs": {
            "data": {
              "terms": {
                "field": "referer.keyword",
                "size": 5,
                "order": {
                  "_count": "desc"
                }
              }
            }
          }
        }
      },
      "size": 0,
      "_source": {
        "excludes": []
      },
      "stored_fields": [
        "*"
      ],
      "script_fields": {},
      "docvalue_fields": [
        {
          "field": "curdate",
          "format": "date_time"
        },
        {
          "field": "curdatetime",
          "format": "date_time"
        },
        {
          "field": "timestamp",
          "format": "date_time"
        }
      ],
      "query": {
        "bool": {
          "must": [
            {
              "bool": {
                "minimum_should_match": 1,
                "should": videoShould
              }
            },
            {
              "bool": {
                "minimum_should_match": 1,
                "should": partnerShould
              }
            },
            {
              "match_phrase": {
                "_type": {
                  "query": "impression"
                }
              }
            },
            {
              "bool": {
                "should": [
                  {
                    "match": {
                      "_type": "pageview"
                    }
                  },
                  {
                    "match": {
                      "_type": "impression"
                    }
                  }
                ]
              }
            },
            {
              "range": {
                "timestamp": {
                  "gte": startDate,
                  "lte": endDate,
                  "format": "epoch_millis"
                }
              }
            },
            {
              "bool": {
                "should": [
                  {
                    "match": {
                      "_type": "pageview"
                    }
                  },
                  {
                    "match": {
                      "_type": "impression"
                    }
                  }
                ]
              }
            }
          ],
          "filter": [],
          "should": [],
          "must_not": []
        }
      }
    }
  }
  let refresult = [];
  rp(options).then((aggregateData) => {
    if(aggregateData.aggregations){
      aggregateData.aggregations.data.buckets.map((data, index) => {
        data.data['buckets'].map((data1,index) => {
          let obj = {
            date : moment(data.key_as_string).format('YYYY-MM-DD'),
            domain : data1.key,
            count : data1.doc_count.toString()
          }
          refresult.push(obj);  
        })              
      })
      res.status(200).json({Status: "success", data: refresult });
    }else{
      res.status(202).json({Status: "success", data: []});
    }
  }).catch((error) => {
    res.status(500).json({Status: "Failure", result: error});
  })
}

async function fetchDomainData(req,res){

 // let video_label = 'Discovery Sports';
 var startDate = modifyDateFormat(req.body.date.startDate);
 var endDate = modifyDateFormat(req.body.date.endDate);
 endDate = endDate + 86400000;

  var videoShould = [];
  var partnerShould = [];
  if(req.body.videoid && req.body.videoid.length>0) {
    req.body.videoid.forEach(videoid => {
      videoShould.push({"match_phrase": {"campaignname": videoid.label}})  
    });
  } 
  if(req.body.partnerId && req.body.partnerId.length>0) {
    req.body.partnerId.forEach(partner => {
      partnerShould.push({"match_phrase": {"pubname": partner.label}});  
    });
  }
  let options = {
    method : 'GET',
    uri : sails.config.elasticUrl +'/video-*/_search?pretty',
    json: true,
    body: {
      "aggs": {
        "data": {
          "date_histogram": {
            "field": "timestamp",
            "interval": "1d",
            "time_zone": "Asia/Kolkata",
            "min_doc_count": 1
          },
          "aggs": {
            "data": {
              "terms": {
                "field": "domain.keyword",
                "size": 1000000,
                "order": {
                  "_count": "desc"
                }
              }
            }
          }
        }
      },
      "size": 0,
      "_source": {
        "excludes": []
      },
      "stored_fields": [
        "*"
      ],
      "script_fields": {},
      "docvalue_fields": [
        {
          "field": "curdate",
          "format": "date_time"
        },
        {
          "field": "curdatetime",
          "format": "date_time"
        },
        {
          "field": "timestamp",
          "format": "date_time"
        }
      ],
      "query": {
        "bool": {
          "must": [
            {
              "bool": {
                "minimum_should_match": 1,
                "should": videoShould
              },
            },
            {
              "bool": {
                "minimum_should_match": 1,
                "should": partnerShould
              }
            },
            {
              "match_all": {}
            },
            {
              "match_all": {}
            },
            {
              "range": {
                "timestamp": {
                  "gte": startDate,
                  "lte": endDate,
                  "format": "epoch_millis"
                }
              }
            }
          ],
          "filter": [
            {
              "match_all": {}
            }
          ],
          "should": [],
          "must_not": []
        }
      }
    }
  }
  let result = [];
  rp(options).then((aggregateData) => {
    if(aggregateData.aggregations){
      aggregateData.aggregations.data.buckets.map((data, index) => {
        data.data['buckets'].map((data1,index) => {
          let obj = {
            date : moment(data.key_as_string).format('YYYY-MM-DD'),
            host : data1.key,
            total : data1.doc_count.toString()
          }
          result.push(obj);  
        })              
      })
      res.status(200).json({Status: "success", data: result });
    }else{
      res.status(202).json({Status: "success", data: []});
    }
  }).catch((error) => {
    res.status(500).json({Status: "Failure", result: error});
  })
}


// fetch platform data

async function fetchPlatfromDataDaywise(req,res){

  // let video_label = 'Discovery Sports';
  var startDate = modifyDateFormat(req.body.date.startDate);
  var endDate = modifyDateFormat(req.body.date.endDate);
  endDate = endDate + 86400000;

   var videoShould = [];
   var partnerShould = [];
   if(req.body.videoid && req.body.videoid.length>0) {
     req.body.videoid.forEach(videoid => {
       videoShould.push({"match_phrase": {"campaignname": videoid.label}})  
     });
   } 
   if(req.body.partnerId && req.body.partnerId.length>0) {
     req.body.partnerId.forEach(partner => {
       partnerShould.push({"match_phrase": {"pubname": partner.label}});  
     });
   }
   let options = {
     method : 'GET',
     uri : sails.config.elasticUrl +'/video-*/_search?pretty',
     json: true,
     body: {
       "aggs": {
         "data": {
           "date_histogram": {
             "field": "timestampGMT",
             "interval": "1d",
             "time_zone": "Asia/Kolkata",
             "min_doc_count": 1
           },
           "aggs": {
             "data": {
               "terms": {
                 "field": "platform.keyword",
                 "size": 5,
                 "order": {
                   "_count": "desc"
                 }
               }
             }
           }
         }
       },
       "size": 0,
       "_source": {
         "excludes": []
       },
       "stored_fields": [
         "*"
       ],
       "script_fields": {},
       "docvalue_fields": [
         {
           "field": "curdate",
           "format": "date_time"
         },
         {
           "field": "curdatetime",
           "format": "date_time"
         },
         {
           "field": "timestamp",
           "format": "date_time"
         }
       ],
       "query": {
         "bool": {
           "must": [
             {
               "bool": {
                 "minimum_should_match": 1,
                 "should": videoShould
               },
             },
             {
               "bool": {
                 "minimum_should_match": 1,
                 "should": partnerShould
               }
             },
             {
               "match_all": {}
             },
             {
               "match_all": {}
             },
             {
               "range": {
                 "timestampGMT": {
                   "gte": startDate,
                   "lte": endDate,
                   "format": "epoch_millis"
                 }
               }
             }
           ],
           "filter": [
             {
               "match_all": {}
             }
           ],
           "should": [],
           "must_not": []
         }
       }
     }
   }
   var result = [];
   rp(options).then((aggregateData) => {
     if(aggregateData.aggregations){
       aggregateData.aggregations.data.buckets.map((data, index) => {
         data.data['buckets'].map((data1,index) => {
           let obj = {
             date : moment(data.key_as_string).format('YYYY-MM-DD'),
             platform : data1.key,
             total : data1.doc_count.toString()
           }
           result.push(obj);  
         })              
       })
       res.status(200).json({Status: "success", data: result });
     }else{
       res.status(202).json({Status: "success", data: []});
     }
   }).catch((error) => {
     res.status(500).json({Status: "Failure", result: error});
   })
 }


 //fetch country data
 // fetch platform data

async function fetchCountryData(req,res){

  // let video_label = 'Discovery Sports';
  var startDate = modifyDateFormat(req.body.date.startDate);
  var endDate = modifyDateFormat(req.body.date.endDate);
  endDate = endDate + 86400000;

   var videoShould = [];
   var partnerShould = [];
   if(req.body.videoid && req.body.videoid.length>0) {
     req.body.videoid.forEach(videoid => {
       videoShould.push({"match_phrase": {"campaignname": videoid.label}})  
     });
   } 
   if(req.body.partnerId && req.body.partnerId.length>0) {
     req.body.partnerId.forEach(partner => {
       partnerShould.push({"match_phrase": {"pubname": partner.label}});  
     });
   }
   let options = {
     method : 'GET',
     uri : sails.config.elasticUrl +'/video*/_search?pretty',
     json: true,
     body: {
      "aggs": {
        "data": {
          "terms": {
            "field": "country.keyword",
            "size": 1000000000,
            "order": {
              "_count": "desc"
            }
          }
        }
      },
       "size": 0,
       "_source": {
         "excludes": []
       },
       "stored_fields": [
         "*"
       ],
       "script_fields": {},
       "docvalue_fields": [
         {
           "field": "curdate",
           "format": "date_time"
         },
         {
           "field": "curdatetime",
           "format": "date_time"
         },
         {
           "field": "timestamp",
           "format": "date_time"
         }
       ],
       "query": {
         "bool": {
           "must": [
             {
               "bool": {
                 "minimum_should_match": 1,
                 "should": videoShould
               },
             },
             {
               "bool": {
                 "minimum_should_match": 1,
                 "should": partnerShould
               }
             },
             {
               "match_all": {}
             },
             {
               "match_all": {}
             },
             {
               "range": {
                 "timestampGMT": {
                   "gte": startDate,
                   "lte": endDate,
                   "format": "epoch_millis"
                 }
               }
             }
           ],
           "filter": [
             {
               "match_all": {}
             }
           ],
           "should": [],
           "must_not": []
         }
       }
     }
   }
   var result = [];
   rp(options).then((aggregateData) => {
     if(aggregateData.aggregations){
       aggregateData.aggregations.data.buckets.map((data, index) => {  
         let obj = {
          country : data.key,
          total : data.doc_count.toString()
        }
        result.push(obj);           
       })
       res.status(200).json({Status: "success", data: result });
     }else{
       res.status(202).json({Status: "success", data: []});
     }
   }).catch((error) => {
     res.status(500).json({Status: "Failure", result: error});
   })
 }

 
// to fetch daywise impression  data

function fetchDaywiseImpData(req,res){
  var startDate = modifyDateFormat(req.body.date.startDate);
  var endDate = modifyDateFormat(req.body.date.endDate);
  endDate = endDate + 86400000;

  var videoShould = [];
  var partnerShould = [];
  if(req.body.videoid && req.body.videoid.length>0) {
    req.body.videoid.forEach(videoid => {
      videoShould.push({"match_phrase": {"campaignname": videoid.label}})  
    });
  } 
  if(req.body.partnerId && req.body.partnerId.length>0) {
    req.body.partnerId.forEach(partner => {
      partnerShould.push({"match_phrase": {"pubname": partner.label}});  
    });
  }
//let video_label = 'Discovery Sports';
let options = {
  method : 'GET',
  uri : sails.config.elasticUrl +'/video-imp*/_search?pretty',
  json: true,
  body:{
    "aggs": {
      "data": {
        "date_histogram": {
          "field": "timestampGMT",
          "interval": "1d",
          "time_zone": "Asia/Kolkata",
          "min_doc_count": 1
        },
        "aggs": {
          "1": {
            "cardinality": {
              "field": "impid.keyword"
            }
          }
        }
      }
    },
    "size": 0,
    "_source": {
      "excludes": []
    },
    "stored_fields": [
      "*"
    ],
    "script_fields": {},
    "docvalue_fields": [
      {
        "field": "date",
        "format": "date_time"
      },
      {
        "field": "timestamp",
        "format": "date_time"
      },
      {
        "field": "timestampGMT",
        "format": "date_time"
      }
    ],
    "query": {
      "bool": {
        "must": [
          {
            "bool": {
              "minimum_should_match": 1,
              "should": videoShould
            },
          },
          {
            "bool": {
              "minimum_should_match": 1,
              "should": partnerShould
            }
          },
          {
            "match_all": {}
          },
          {
            "match_all": {}
          },
          {
            "range": {
              "timestampGMT": {
                "gte": startDate,
                "lte": endDate,
                "format": "epoch_millis"
              }
            }
          }
        ],
        "filter": [],
        "should": [],
        "must_not": []
      }
    }
  }
}
let brresult =  [];
rp(options).then((aggregateData) => {
  if((aggregateData.aggregations && aggregateData.aggregations.data.buckets && aggregateData.aggregations.data.buckets.length)){
    aggregateData.aggregations.data.buckets.map((data, index) => {
      // data.data['buckets'].map((data1, index) => {
         
      // })
      let obj = {
        date : moment(data.key_as_string).format('YYYY-MM-DD'),
        imp : data.doc_count, 
      }
      brresult.push(obj);
    })
    res.json({data:brresult});
  }else{
    res.status(202).json({Status: "success", data: []});
  }
}).catch((error) => {
  res.status(500).json({Status: "Failure", result: error});
})
}

// function fetchDaywiseImpData(req,res){
//   var startDate = moment(new Date(req.body.date.startDate)).format('YYYY-MM-DD'); 
//   var endDate = moment(new Date(req.body.date.endDate)).format('YYYY-MM-DD');
//   var video = '';
//   if(req.body.videoid.length > 0){
//   var v = req.body.videoid;
//   var VideoId = concatVideoId(v);
//   video = "where videoid in "+VideoId;
//   }
//   var query = `select to_char("Date",'YYYY-MM-DD') as "date",sum("Impression") as "imp" from date_count_views('`+startDate+`','`+endDate+`',ARRAY(select distinct videoid from view_videotitle `+video+`),
//   ARRAY(select distinct pubid from publisher_mapping)) where "Date" is not null group by 1 order by 1 desc;`;
//   console.log(query);
//   mysql_connection.query(query,[],function(err, response) {
//       if(err){
//           console.log(err,'err');
//           return res.json({ data: err, err:"Error in Db request"});
//         }
//         console.log('check all plt data',response.rows)
//         if (response && response.rows && response.rows.length > 0) {
//           return res.json({data:response.rows})
//         }else{
//           return res.json({data:[]})
//         }
//      })
// }

function fetchVideoViewsData(req,res){
  var startDate = modifyDateFormat(req.body.date.startDate);
  var endDate = modifyDateFormat(req.body.date.endDate);
  endDate = endDate + 86400000;

  var videoShould = [];
  var partnerShould = [];
  if(req.body.videoid && req.body.videoid.length>0) {
    req.body.videoid.forEach(videoid => {
      videoShould.push({"match_phrase": {"campaignname": videoid.label}})  
    });
  } 
  if(req.body.partnerId && req.body.partnerId.length>0) {
    req.body.partnerId.forEach(partner => {
      partnerShould.push({"match_phrase": {"pubname": partner.label}});  
    });
  }
let options = {
  method : 'GET',
  uri : sails.config.elasticUrl +'/video*/_search?pretty',
  json: true,
  body:{
    "aggs": {
      "data": {
        "date_histogram": {
          "field": "timestampGMT",
          "interval": "1d",
          "time_zone": "Asia/Kolkata",
          "min_doc_count": 1
        },
        "aggs": {
          "1": {
            "cardinality": {
              "field": "viewid.keyword"
            }
          },
          "2": {
            "cardinality": {
              "field": "sessionid.keyword"
            }
          }
        }
      }
    },
    "size": 0,
    "_source": {
      "excludes": []
    },
    "stored_fields": [
      "*"
    ],
    "script_fields": {},
    "docvalue_fields": [
      {
        "field": "date",
        "format": "date_time"
      },
      {
        "field": "timestamp",
        "format": "date_time"
      },
      {
        "field": "timestampGMT",
        "format": "date_time"
      }
    ],
    "query": {
      "bool": {
        "must": [
          {
            "bool": {
              "minimum_should_match": 1,
              "should": videoShould
            },
          },
          {
            "bool": {
              "minimum_should_match": 1,
              "should": partnerShould
            }
          },
          {
            "match_all": {}
          },
          {
            "match_all": {}
          },
          {
            "range": {
              "timestampGMT": {
                "gte": startDate,
                "lte": endDate,
                "format": "epoch_millis"
              }
            }
          }
        ],
        "should": [],
        "must_not": []
      }
    }
  }
}
let brresult =  [];
rp(options).then((aggregateData) => {
  if((aggregateData.aggregations && aggregateData.aggregations.data.buckets && aggregateData.aggregations.data.buckets.length)){
    aggregateData.aggregations.data.buckets.map((data, index) => {
      
        let obj = {
          date : moment(data.key_as_string).format('YYYY-MM-DD'),
          total_views: data['1'].value,
          unique_views: data['2'].value            
        }
      brresult.push(obj);
    })
    res.json({data:brresult});
  }else{
    res.status(202).json({Status: "success", data: []});
  }
}).catch((error) => {
  res.status(500).json({Status: "Failure", result: error});
})
}

// function fetchVideoViewsData(req,res){
//   var startDate = moment(new Date(req.body.date.startDate)).format('YYYY-MM-DD'); 
//   var endDate = moment(new Date(req.body.date.endDate)).format('YYYY-MM-DD');
//   var video = '';
//   if(req.body.videoid.length > 0){
//   var v = req.body.videoid;
//   var VideoId = concatVideoId(v);
//   video ="where videoid in"+VideoId;
//   }
//   var query = `select to_char("Date",'YYYY-MM-DD') as "date",sum("Total Views") as "total_views",sum("Unique Views") as "unique_views" from date_count_views('`+startDate+`','`+endDate+`',ARRAY(select distinct videoid from view_videotitle `+video+`),
//   ARRAY(select distinct pubid from publisher_mapping)) where "Date" is not null group by 1 order by 1 desc;`;
//   console.log(query);
//   mysql_connection.query(query,[],function(err, response) {
//       if(err){
//           console.log(err,'err');
//           return res.json({ data: err, err:"Error in Db request"});
//         }
//         console.log('check all plt data',response.rows)
//         if (response && response.rows && response.rows.length > 0) {
//           return res.json({data:response.rows})
//         }else{
//           return res.json({data:[]})
//         }
//      })
// }

// to fetch country wise campaign data

function fetchCountryWiseData(req,res){
  //let video_label = 'Discovery Sports';
  var startDate = modifyDateFormat(req.body.date.startDate);
  var endDate = modifyDateFormat(req.body.date.endDate);
  endDate = endDate + 86400000;

  //Get Request Options for kibana elastic search API
  let options = {
    method : 'GET',
    uri : sails.config.elasticUrl +'/video-*/_search?pretty',
    body: {
      "aggs": {
        "data": {
          "date_histogram": {"field": "timestamp", "interval": "1d", "time_zone": "Asia/Kolkata", "min_doc_count": 1},
          "aggs": {
            "bucket_data": {
              "terms": {"field": "country.keyword", "size": 5, "order": {"1": "desc"}, "missing": "__missing__"},
              "aggs": {"1": {"cardinality": {"field": "viewid.keyword"}}}
            }
          }
        }
      },
      "size": 0,
      "_source": {"excludes": []},
      "stored_fields": ["*"],
      "script_fields": {},
      "docvalue_fields": [
        {"field": "curdate","format": "date_time"},
        {"field": "curdatetime","format": "date_time"},
        {"field": "timestamp","format": "date_time"}
      ],
      "query": {
        "bool": {
          "must": [
           // {"bool": {"minimum_should_match": 1,"should": [{"match_phrase": {"title.keyword": video_label}}]}},
            {"match_phrase": {"_type": {"query": "pageview"}}},
            {"range": {"timestamp": {"gte": startDate,"lte": endDate,"format": "epoch_millis"}}},
            {"match_phrase": {"_type": {"query": "pageview"}}}
          ],
          "filter": [
            {"match_all": {}},
            {"match_all": {}}
          ],
          "should": [],
          "must_not": []
        }
      }
    },
    json: true
  };
  rp(options).then((aggregateData) => {
     if(aggregateData.aggregations && aggregateData.aggregations.data.buckets && aggregateData.aggregations.data.buckets.length){
       // console.log('\naggregateData.aggregations.data.buckets:', JSON.stringify(aggregateData.aggregations.data.buckets));
       aggregateData.aggregations.data.buckets.map((data, index) => {
         data['date'] = moment(data.key_as_string).format('YYYY-MM-DD');
         data.bucket_data['buckets'].map((bucket_json, index) => {
           data['country'] = bucket_json['key'];
           data['count'] = bucket_json['doc_count'];
         })
       });
       res.status(200).json({Status: "success", data: aggregateData.aggregations.data.buckets});
     }else{
       res.status(202).json({Status: "success", data: []});
     }
  }).catch((error) => {
    res.status(500).json({Status: "Failure", result: error});
  })
}

// to fetch campaign list

async function fetchCampaignList(req, res){
  let options = {
    method : 'GET',
    uri : sails.config.elasticUrl +'/campaign_mapping/_search?_source_includes=campaignname,id&pretty',
    json : true
  }
  let result =  [];
  rp(options).then((aggregateData) => {
    if(aggregateData){
      aggregateData['hits']['hits'].map((data1,index) => {
        let obj = {
          id : data1['_source'].id,
          name : data1['_source'].campaignname
        }
        result.push(obj)
      })
      
      res.status(200).json(result);
    }else{
      res.status(202).json({Status: "success", data: []});
    }
  }).catch((error) => {
    res.status(500).json({Status: "Failure", result: error});
  })
}

// to fetch publisher list

async function fetchPubList(req, res){
  let options = {
    method : 'GET',
    uri : sails.config.elasticUrl + '/publisher_mapping/_search?_source_includes=pubname,id&pretty',
    json : true
  }
  let result =  [];
  rp(options).then((aggregateData) => {
    if(aggregateData){
      aggregateData['hits']['hits'].map((data1,index) => {
        let obj = {
          id : data1['_source'].id,
          name : data1['_source'].pubname
        }
        result.push(obj)
      })
      
      res.status(200).json(result);
    }else{
      res.status(202).json({Status: "success", data: []});
    }
  }).catch((error) => {
    res.status(500).json({Status: "Failure", result: error});
  })
}

// to fetch data from elastic and update into mongo
async function fetchImpressionCron(data){
  var startDate = modifyDateFormat(req.body.date.startDate);
  var endDate = modifyDateFormat(req.body.date.endDate);
  endDate = endDate + 86400000;

  var video = '';
  if(data.videoid.length > 0){
  var v = data.videoid;
  var VideoId = concatVideoId(v);
  video = "where id in "+VideoId;
  } 
  
  var query = `select sum("Impression") as "imp" , sum("Total Views") as "total_views",sum("Unique Views") as "unique_views" ,round((sum("Total Views")/sum("Impression"))*100,2) as "ctr" from count_views('`+startDate+`','`+endDate+`',ARRAY(select distinct id from campaign_mapping `+video+`),ARRAY(select distinct pubid from publisher_mapping))`;

  return new Promise((resolve,reject)=>{
    let response = mysql_connection.query(query, []);

    if (response && response.rows && response.rows.length > 0) {
      return resolve(response.rows);
    } else {
      return resolve(data = []);
    }
  })  
}

// for testing 
async function ABRData(req,res) {
  //let video_label = 'Discovery Sports';
  var startDate = modifyDateFormat(req.body.date.startDate);
  var endDate = modifyDateFormat(req.body.date.endDate);
  endDate = endDate + 86400000;

  let options = {
    method : 'GET',
    uri : 'http://10.0.1.4:9200/video-*/_search?pretty',
    json: true,
    body: {
      "aggs": {
        "impression": {
          "cardinality": {
            "field": "impid.keyword"
          }
        },
        "views": {
          "cardinality": {
            "field": "viewid.keyword"
          }
        },
        "unique_views": {
          "cardinality": {
            "field": "sessionid.keyword"
          }
        }
      },
      "size": 0,
      "_source": {
        "excludes": []
      },
      "stored_fields": [
        "*"
      ],
      "script_fields": {},
      "docvalue_fields": [
        {
          "field": "curdate",
          "format": "date_time"
        },
        {
          "field": "curdatetime",
          "format": "date_time"
        },
        {
          "field": "timestamp",
          "format": "date_time"
        }
      ],
      "query": {
        "bool": {
          "must": [
           {
              "range": {
                "timestamp": {
                  "gte": 1546281000000,
                  "lte": 1577816999999,
                  "format": "epoch_millis"
                }
              }
            }
          ],
          "filter": [
            {
              "match_all": {}
            },
            {
              "match_all": {}
            }
          ],
          "should": [],
          "must_not": []
        }
      }
    }
  }
  let result =  [];
  rp(options).then((aggregateData) => {
    if(aggregateData.aggregations){

      // aggregateData.aggregations['2'].buckets.forEach(bucket_data => {
      //   if(bucket_data.ABR['buckets'].length){
      //     bucket_data.ABR['buckets'].forEach(ABR_data => {
      //       result.push({
      //         count: ABR_data.doc_count.toString(),
      //         date: moment(bucket_data.key_as_string).format('YYYY-MM-DD'),
      //         split_part: ABR_data.key.split('_')[2]
      //       })
      //     })
      //   }
      // })
      result = aggregateData.aggregations;
      res.status(200).json({Status: "success", data: result});
    }else{
      res.status(202).json({Status: "success", data: []});
    }
  }).catch((error) => {
    res.status(500).json({Status: "Failure", result: error});
  })
}
// to update campaign data

async function updateCamp(){    
    let options = {
      method : 'GET',
      uri : sails.config.elasticUrl + '/video*/_search?pretty',
      body:{
        "aggs": {
          "data": {
            "terms": {
              "field": "campaignname.keyword",
              "size": 5,
              "order": {
                "1": "desc"
              }
            },
            "aggs": {
              "1": {
                "cardinality": {
                  "field": "impid.keyword"
                }
              },
              "data": {
                "terms": {
                  "field": "campaignid.keyword",
                  "size": 5,
                  "order": {
                    "1": "desc"
                  }
                },
                "aggs": {
                  "1": {
                    "cardinality": {
                      "field": "impid.keyword"
                    }
                  },
                  "4": {
                    "cardinality": {
                      "field": "viewid.keyword"
                    }
                  }
                }
              }
            }
          }
        },
        "size": 0,
        "_source": {
          "excludes": []
        },
        "stored_fields": [
          "*"
        ],
        "script_fields": {},
        "docvalue_fields": [
          {
            "field": "curdate",
            "format": "date_time"
          },
          {
            "field": "curdatetime",
            "format": "date_time"
          },
          {
            "field": "timestamp",
            "format": "date_time"
          }
        ],
        "query": {
          "bool": {
            "must": [
              {
                "bool": {
                  "should": [
                    {
                      "match_phrase": {
                        "_type": "impression"
                      }
                    },
                    {
                      "match_phrase": {
                        "_type": "pageview"
                      }
                    }
                  ],
                  "minimum_should_match": 1
                }
              },
              {
                "bool": {
                  "should": [
                    {
                      "match_phrase": {
                        "_type": "impression"
                      }
                    },
                    {
                      "match_phrase": {
                        "_type": "pageview"
                      }
                    }
                  ],
                  "minimum_should_match": 1
                }
              }
            ],
            "filter": [
              {
                "match_all": {}
              },
              {
                "match_all": {}
              }
            ],
            "should": [],
            "must_not": []
          }
        }
      },
      json: true
    };
    campresult = [];
    rp(options).then((aggregateData) => {
       if(aggregateData.aggregations){
         aggregateData.aggregations.data.buckets.map((data, index) => {
           data.data['buckets'].map((bucket_json, index) => {
             let obj ={
               imp : bucket_json['1'].value,
               views : bucket_json['4'].value,
               id: bucket_json.key,
               name : data.key
             }
             campresult.push(obj);
           })
         });

         campresult.forEach(campEl => {
          Campaign.update({ cid: campEl.id }, {
            mis_imp: campEl.imp,
            mis_views: campEl.views
          }).then(_data => {
          }).catch(err => res.serverError(err.message));
         });
        
         console.log({Status: "success", data: campresult});
       }else{
         console.log({Status: "success", data: []});
       }
    }).catch((error) => {
      console.log({Status: "Failure", result: error});
    })
}

// to update publisher data

async function updatePub(){    
  let options = {
    method : 'GET',
    uri : sails.config.elasticUrl + '/video*/_search?pretty',
    body:{
      "aggs": {
        "data": {
          "terms": {
            "field": "pubname.keyword",
            "size": 5,
            "order": {
              "1": "desc"
            }
          },
          "aggs": {
            "1": {
              "cardinality": {
                "field": "viewid.keyword"
              }
            },
            "2": {
              "cardinality": {
                "field": "impid.keyword"
              }
            }
          }
        }
      },
      "size": 0,
      "_source": {
        "excludes": []
      },
      "stored_fields": [
        "*"
      ],
      "script_fields": {},
      "docvalue_fields": [
        {
          "field": "curdate",
          "format": "date_time"
        },
        {
          "field": "curdatetime",
          "format": "date_time"
        },
        {
          "field": "timestamp",
          "format": "date_time"
        }
      ],
      "query": {
        "bool": {
          "must": [
            {
              "bool": {
                "should": [
                  {
                    "match_phrase": {
                      "_type": "impression"
                    }
                  },
                  {
                    "match_phrase": {
                      "_type": "pageview"
                    }
                  }
                ],
                "minimum_should_match": 1
              }
            },
            // {
            //   "range": {
            //     "timestamp": {
            //       "gte": 1413545158404,
            //       "lte": 1571311558404,
            //       "format": "epoch_millis"
            //     }
            //   }
            // },
            {
              "bool": {
                "should": [
                  {
                    "match_phrase": {
                      "_type": "impression"
                    }
                  },
                  {
                    "match_phrase": {
                      "_type": "pageview"
                    }
                  }
                ],
                "minimum_should_match": 1
              }
            }
          ],
          "filter": [
            {
              "match_all": {}
            },
            {
              "match_all": {}
            }
          ],
          "should": [],
          "must_not": []
        }
      }
    },
    json: true
  };
  pubresult = [];
  rp(options).then((aggregateData) => {
     if(aggregateData.aggregations){
       aggregateData.aggregations.data.buckets.map((data, index) => {
           let obj ={
             imp : data['2'].value,
             views : data['1'].value,
             name: data.key,
           }
           pubresult.push(obj);
       });

       pubresult.forEach(pubEl => {
        Creative.update({ name: pubEl.name }, {
          impression: pubEl.imp,
          views: pubEl.views
        }).then(_data => {
        }).catch(err => res.serverError(err.message));
       });
      
       console.log({Status: "success", data: pubresult});
     }else{
       console.log({Status: "success", data: []});
     }
  }).catch((error) => {
    console.log({Status: "Failure", result: error});
  })
}
