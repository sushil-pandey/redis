/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs just before your Sails app gets lifted.
 * > Need more flexibility?  You can also do this by creating a hook.
 *
 * For more information on bootstrapping your app, check out:
 * https://sailsjs.com/config/bootstrap
 */


var kafka = require('kafka-node');

var redis =  require('redis');

var pg = require('pg');


module.exports.bootstrap = async function(done) {


//  var kafkaclient = new kafka.KafkaClient(sails.config.kafkaconnector);       
  //var kafkaclient = new kafka.Client('52.172.134.178:2181');       
  var kafkaclient = new kafka.Client('172.16.2.17:2181');       
// var kafkaclient = new kafka.KafkaClient({kafkaHost:sails.config.custom.kafkaconnector_dev.host+':'+sails.config.custom.kafkaconnector_dev.port});       
  var kafkaproducer = new kafka.HighLevelProducer(kafkaclient);
  kafkaproducer.on("ready", function() {
    console.log("Kafka Producer is connected and ready.");
    global.kfkproducer = kafkaproducer;
});
 
// For this demo we just log producer errors to the console.
kafkaproducer.on("error", function(error) {
    // console.error('kafka eeeeeeee--',error);
});


var pool = new pg.Pool(sails.config.datastores.postgresDBserver);

global.mysql_connection = pool;


var redisClient = redis.createClient(sails.config.custom.redis_prod);

redisClient.on('error',function(err){
  console.log('error in redis---------',err);
});

global.redisClient = redisClient;


  // By convention, this is a good place to set up fake data during development.
  //
  // For example:
  // ```
  // // Set up fake development data (or if we already have some, avast)
  // if (await User.count() > 0) {
  //   return done();
  // }
  //
  // await User.createEach([
  //   { emailAddress: 'ry@example.com', fullName: 'Ryan Dahl', },
  //   { emailAddress: 'rachael@example.com', fullName: 'Rachael Shaw', },
  //   // etc.
  // ]);
  // ```

  // Don't forget to trigger `done()` when this bootstrap function's logic is finished.
  // (otherwise your server will never lift, since it's waiting on the bootstrap)
  return done();

};
