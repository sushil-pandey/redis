/**
 * BlockController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  
    create: function (req, res) {
        var data = {
            website: req.body.website,
            status: req.body.status,
            campaign: req.body.campaign
        };
        Block.create(data).fetch().then(d => {
            redisClient.set('blocklist'+'_'+d.campaign,JSON.stringify(d));
            res.send(d);
        })
    },

    findAll: function (req, res) {
        var query = {
            limit: 10,
            skip: 0,
            sort: 'createdAt'
        };
        var mainquery = {};

        if ((Object.keys(req.query)).length) {
            var data = req.query;
            (data.limit) ? (query.limit = data.limit) : null;
            (data.skip) ? (query.skip = data.skip) : null;
            (data.sort) ? (query.sort = data.sort) : null;
            (data.name) ? mainquery.name = { 'like': '%' + data.name + '%' } : null;
        }

        query.where = mainquery;

        Block.find(query).populate('campaign').exec(function (err, thing) {
            if (err) {
                return res.status(500).send(err);
            }

            if (!thing) {
                return res.status(400).send(err);
            }
            return res.json({ data: thing, count: thing.length });

        })
    },

    updateBlockList: async function (req, res) {
        if (!req.body) {
            return res.status(400).send({ msg: "give corect params" });
        }
        Block.update({ _id: req.body.id })
            .set(req.body).then(d => {
                redisClient.set('blocklist'+'_'+req.body.campaign,JSON.stringify(req.body));
                res.status(200).send({msg:'Successfully Updated'})
            })
            .catch(err => {
                res.status(400).send('Not Exist')
            })
    },

    deleteBlockList: async function (req, res) {
        if (!req.body) {
            return res.status(400).send({ msg: "give corect params" });
        }
        Block.findOne({ _id: req.body.id }).then(d => {

            redisClient.del("blocklist"+'_'+d.campaign, function (err, data) {
                if (err) return res.serverError(err);
            });

            Block.destroyOne({ _id: req.body.id }).then(d => {
                res.status(200).send({ msg:'Successfully Updated'})
            })
            .catch(err => {
                res.status(400).send({ msg:'Some problem Occur'})
            })
                
            })
            .catch(err => {
                res.status(400).send({ msg:'Not Exist'})
            })
    },

    getRedisData: function(req,res){
        redisClient.get("blocklist"+'_'+req.query.ca, function (err, data) {
            if (err) return res.serverError(err);
            return res.ok(JSON.parse(data))
        });
    },

    validateCampaignWithRef: function (req, res) {
        if (req.query.ca && req.query.ref) {
            redisClient.get("blocklist" + '_' + req.query.ca, function (err, data) {
                if (err) return res.serverError(err);
                if (data == null){
                    return res.send({status:false,msg:'Invalid campaign'});
                }
                else {
                    var campaignData = JSON.parse(data);
                    var fetch = false;
                    campaignData.website.forEach(element => {
                        var personRegExp = new RegExp(element);
                        if (personRegExp.test(req.query.ref)) {
                            fetch = true;
                           return res.send({status:true,msg:'Vaild Referer'});
                        }
                    });
                    if(fetch == false){
                        res.send({status:false,msg:'Invaild Referer'});
                    }
                }

            });
        }
    }
};

