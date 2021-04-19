const passport = require('passport')
var LocalStrategy = require('passport-local').Strategy;
const sha = require('sha256')
const activeDirectory = require('activedirectory');
const keys = require('../config/keys')
const sql = require('mssql/msnodesqlv8');
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
        done(null, user.EmployeeID);
    });

    // used to deserialize the user
    passport.deserializeUser(async function(employeeID, done) {
        try{
             let pool = await connection
            
             let result = await pool.request()
             .input('employeeID', sql.VarChar(20), employeeID)
             .execute('usp_web_getEmployeesInfo')

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
            // by default, local strategy uses username and password, we will override with email
            usernameField: 'username',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass back the entire request to the callback
        },
        function(req, name, password, done) { // callback with name and password from our form
            let pool
            async function verifyAuth(){

                try{   
                    hash = sha(password)    
                    pool = await connection;

                    let result = await pool.request()
                    .input('userID', sql.VarChar(20), name)
                    .input('password', sql.VarChar(70), hash)
                    .execute('usp_web_verifyEmployee')


                    if (!result.recordset.length) {
                        
                        //console.log(`Authenticating Active Directoy for username ${name}`)

                        ad.authenticate(`${name}@rroese.com`, password, async function(err, auth) {
                            //Commeting this error out during development because this error fires when connection to ad does not fire which is always the case in development
                            if (err) {
                              console.log('ERROR: '+JSON.stringify(err));
                              return done(null, false, req.flash('invalidAuth', 'No account was found associated with this username'));
                              
                            }
                               
                            if (auth) {
                               //This user was able to authticate against the active dirctory but not using table based authentication
                               await pool.request()
                               .input('userID', sql.VarChar(20), name)
                               .input('password', sql.VarChar(70), hash)
                               .execute('usp_web_createLocalUserFromAD')

                                // //Assign office as the user role for now because the user was able to perform active directory authentication
                               
                                // let employeeID = await pool.query(`Select employeeID from Employees where firstName = '${name}' and password = '${hash}'`)
                                // employeeID = employeeID.recordset[0].employeeID
                                // let roleID = await pool.query(`select roleID from RoleType where RoleType = 'Office'`)
                                // roleID = roleID.recordset[0].roleID;

                            //     await pool.request()
                            //    .input('employeeID', sql.VarChar(20), employeeID)
                            //    .input('roleID', sql.Int, roleID)
                            //    .execute('usp_web_createUserRole')


                                //FIX ME RANDOMLY ASSIGNING EMPLOYEES TO PEOPLE WHO LOGIN USING AD
                                //ALSO MAKING PEOPLE LOGIN USING AD SUPERVISORS
                                let employeeID = await database.getEmployeeIDFromUserID(name)

                                await pool.query(`update Employees set supervisor = 1, WebLogin = 1 WHERE EmployeeID = ${employeeID};`)

                                // //Add some employees under this person
                                // let employeesWitoutSupervisor = 
                                // await pool.query(`SELECT TOP 5 *  FROM Employees WHERE ReportsTo IS NULL AND Supervisor = 0;`)
                                // employeesWitoutSupervisor = employeesWitoutSupervisor.recordset

                                // let counter = 1
                                // let currentForeMan 
                                // for(let item of employeesWitoutSupervisor){
                                //     if(counter == 1){
                                //         await pool.query(`update Employees SET ReportsTo = ${employeeID}, WebLogin = 1, ForeMan = 1 Where EmployeeID = ${item.EmployeeID}`)
                                //         currentForeMan = item.EmployeeID
                                //     }
                                //     else if(counter == 4){
                                //         await pool.query(`update Employees SET ReportsTo = ${employeeID}, WebLogin = 1, Foreman = 1 Where EmployeeID = ${item.EmployeeID}`)
                                //         currentForeMan = item.EmployeeID
                                //     }
                                //     else{
                                //         await pool.query(`update Employees SET ReportsTo = ${currentForeMan} Where EmployeeID = ${item.EmployeeID}`)
                                //     }
                                //     counter = counter + 1
                                // }



                               let result = await pool.request()
                               .input('userID', sql.VarChar(20), name)
                               .input('password', sql.VarChar(70), hash)
                               .execute('usp_web_verifyEmployee')


                                console.log(result.recordset[0]);
                                return done(null,result.recordset[0]);
                                
                            }
                            else{
                                return done(null, false, req.flash('invalidAuth', 'No account was found associated with this username')); // req.flash is the way to set flashdata using connect-flash
                            }
                          });    
                           
                        
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