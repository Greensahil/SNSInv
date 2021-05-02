const passport = require('passport')
var LocalStrategy = require('passport-local').Strategy;
const sha = require('sha256')
const activeDirectory = require('activedirectory');
const keys = require('../config/keys')
const sql = require('mssql/msnodesqlv8');
const connection = require('../middleware/database').snsWebDBConnection
const database = require('../src/databaseFunctions')


//Setup active directory configuration

let activeDirectoryConfig = {
    url: keys.activeDirectory.url,
    baseDN: keys.activeDirectory.baseDN,
    timeout: 500,
    idleTimeout: 500,
    logging: {
        name: 'ActiveDirectory',
        streams: [
          { level: 'error',
            stream: process.stdout }
        ]
      }
}

let ad = new activeDirectory(activeDirectoryConfig);

// expose this function to our app using module.exports
module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        console.log("Serialize")
        done(null, user.UserID);
    });

    // used to deserialize the user
    passport.deserializeUser(async function(userID, done) {
        try{
            console.log("DeSerialize")
             let pool = await connection

             let result = await pool.query(`SELECT * FROM Users WHERE UserID = '${userID}'`)

              if(!result.recordset[0]){
                return done(null,false);
              }
            
            done(null,result.recordset[0]) 
        }
        catch(err){
            console.log(err)
            return done(null,false);
        }

    });



        passport.use('user-login', new LocalStrategy({
            // by default, local strategy uses username and password
            usernameField: 'name',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass back the entire request to the callback
        },
        function(req, name, password, done) { // callback with name and password from our form
            let pool
            async function verifyAuth(){

                try{   
                    //let hash = sha(password)    
                    pool = await connection;

                    console.log(`SELECT * FROM Users WHERE Pin = '${password}'`)
                    let result = await pool.query(`SELECT * FROM Users WHERE Pin = '${password}'`)


                    if (!result.recordset.length) {
                        return done(null, false, req.flash('invalidAuth', 'No account was found associated with this pin'));
                    }
                    else{
                        return done(null,result.recordset[0]);
                    }
                   

                }
                catch(err){
                    console.trace(err.lineNumber)
                    console.log(err)
                    return done(err);
                }
            }

            verifyAuth()

        }));
};