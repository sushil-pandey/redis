/**
 * Datastores
 * (sails.config.datastores)
 *
 * A set of datastore configurations which tell Sails where to fetch or save
 * data when you execute built-in model methods like `.find()` and `.create()`.
 *
 *  > This file is mainly useful for configuring your development database,
 *  > as well as any additional one-off databases used by individual models.
 *  > Ready to go live?  Head towards `config/env/production.js`.
 *
 * For more information on configuring datastores, check out:
 * https://sailsjs.com/config/datastores
 */

module.exports.datastores = {


    /***************************************************************************
    *                                                                          *
    * Your app's default datastore.                                            *
    *                                                                          *
    * Sails apps read and write to local disk by default, using a built-in     *
    * database adapter called `sails-disk`.  This feature is purely for        *
    * convenience during development; since `sails-disk` is not designed for   *
    * use in a production environment.                                         *
    *                                                                          *
    * To use a different db _in development_, follow the directions below.     *
    * Otherwise, just leave the default datastore as-is, with no `adapter`.    *
    *                                                                          *
    * (For production configuration, see `config/env/production.js`.)          *
    *                                                                          *
    ***************************************************************************/
  
    default: {
  
      /***************************************************************************
      *                                                                          *
      * Want to use a different database during development?                     *
      *                                                                          *
      * 1. Choose an adapter:                                                    *
      *    https://sailsjs.com/plugins/databases                                 *
      *                                                                          *
      * 2. Install it as a dependency of your Sails app.                         *
      *    (For example:  npm install sails-mysql --save)                        *
      *                                                                          *
      * 3. Then pass it in, along with a connection URL.                         *
      *    (See https://sailsjs.com/config/datastores for help.)                 *
      *                                                                          *
      ***************************************************************************/
      // adapter: 'sails-mysql',
      // url: 'mysql://user:password@host:port/database',
  
    },
  
  
    // mongodbServer: {
    //   adapter: 'sails-mongo',
    //   host: 'devdb.videotap.com',
    //   port: 27089,
    //   user: 'dspdev', //optional
    //   password: 'videotap%402019$123', //optional
    //   database: 'dsp-api' //optional
    // },
   
    // mongodbServer: {
    //   adapter: 'sails-mongo',
    //   host: 'devdb.videotap.com',
    //   port: 27089,
    //   user: 'dspdev', //optional
    //   password: 'RV9ts4qGks8UXsVG', //optional
    //   database: 'dsp-api-dev' //optional
    // },
  
    mongodbServer: {
      adapter: 'sails-mongo',
      host: 'localhost',
      port: 27017,
      // user: 'dspdev', //optional
      // password: 'RV9ts4qGks8UXsVG', //optional
      database: 'dsp-api' //optional
    },
    // mongodbServer: {
    //   adapter: 'sails-mongo',
    //   host: 'devdb.videotap.com',
    //   port: 27017,
    //   // user: 'dspdev', //optional
    //   // password: 'RV9ts4qGks8UXsVG', //optional
    //   database: 'dsp-api' //optional
    // },
  
  
    //prod postgress
    // postgresDBserver: {
    //   adapter: 'sails-postgresql',
    //   host: 'prod-analytic-vt.postgres.database.azure.com',
    //   port: 5432,
    //   user: 'prodanalytic@prod-analytic-vt', //optional
    //   password: 'X4vEQBAW4pc8ux88Wfmz6JhM', //optional
    //   database: 'postgres' //optional
    //   //  url: 'postgresql://user:password@host:port/database',
    // },
  
  //DBURL = "jdbc:postgresql://qapostgres-qa1.postgres.database.azure.com/postgres"
  //"user", "prodanalytic@qapostgres-qa1"
  //qa postrgess
  postgresDBserver: {
    adapter: 'sails-postgresql',
    // host: 'qapostgres-qa1.postgres.database.azure.com',
    port: 5432,
    // user: 'prodanalytic@qapostgres-qa1', //optional
    // password: 'X4vEQBAW4pc8ux88Wfmz6JhM', //optional
    database: 'postgres' //optional
    //  url: 'postgresql://user:password@host:port/database',
  },
  
    // redis: {
    //   adapter: 'sails-redis',
    //   port: 6379,
    //   host: 'localhost',
    //  // password: null,
    //  // database: 'bidder',
  
    // },
  
    redis_prod: {
      adapter: 'sails-redis',
      port: 6379,
    //   host: 'prod-redis-vtap.redis.cache.windows.net',
    //   password: "3VL0KXx59qFOZ1sLBwmtTeSDJcLxf6KqFE2z45dt43E=",
  
    },
  
    redis_dev: {
      adapter: 'sails-redis',
      //  port: 6379,
      url: 'redis://localhost:6379',
    },
  
  
  
  };
  