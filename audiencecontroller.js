/**
 * AudienceController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {

    create : function(req, res){
        var body = req.body;
        if(!body)
        return res.send({msg:'Please give correct params'});
        var data = {
           name : body.name,
           time : body.time,
           collectionType: body.collectionType,
           campaigns : body.campaigns,
           status : true
        };
        Audience.create(data).fetch().then(d => {
            if((Object.keys(d.campaigns)).length){
                d.campaigns.forEach(ca => {
                    Campaign.findOne({_id:ca}).exec((err,a)=>{
                        a.audience.push(d.id);
                        Campaign.update({_id:ca}).set(a).exec(a=>{

                        })
                    })
                });
            }
            redisClient.set('audience_group'+'_'+d.id,JSON.stringify(d));
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

        Audience.find(query).exec(function (err, thing) {
            if (err) {
                return res.status(500).send(err);
            }

            if (!thing) {
                return res.status(400).send(err);
            }
            return res.json({ data: thing, count: thing.length });

        })
    },

    
    updateAudiGroup: async function (req, res) {
        if (!req.body) {
            return res.status(400).send({ msg: "give corect params" });
        }
        Audience.update({ _id: req.body.id })
            .set(req.body).then(d => {
                res.status(200).send({msg:'Successfully Updated'})
            })
            .catch(err => {
                res.status(400).send('Not Exist')
            })
    },

    deleteAudiGroup: async function (req, res) {
        if (!req.body) {
            return res.status(400).send({ msg: "give corect params" });
        }
        Audience.findOne({ _id: req.body.id }).then(d => {
            redisClient.del("audience_group"+'_'+d.id, function (err, data) {
                if (err) return res.serverError(err);
            });
            if((Object.keys(d.campaigns)).length){
                d.campaigns.forEach(ca => {
                    Campaign.findOne({_id:ca}).exec((err,a)=>{
                        var index = a.audience.indexOf(d.id);
                        if(index !== -1){
                            a.audience.splice(index, 1)
                        };
                        Campaign.update({_id:ca}).set(a).exec(a=>{

                        })
                    })
                });
            }
            Audience.destroyOne({ _id: req.body.id }).then(d => {
                res.status(200).send({ msg:'Data Deleted Successfully'})
            })
            .catch(err => {
                res.status(400).send({ msg:'Some problem Occur'})
            })
                
            })
            .catch(err => {
                res.status(400).send({ msg:'Not Exist'})
            })
    },

    updateStatus: async function (req, res) {
        let id = req.param('id');
        Audience.update({ id: id }, {
          status: req.param('status'),
        }).then(_data => {
         
          return res.ok('Audience Updated with status');
        }).catch(err => res.serverError(err.message));
      },

};

