const sql = require('mssql/msnodesqlv8');
const keys = require('../config/keys');


//Need this package for windows authentication
require('msnodesqlv8');




let snsDBConfig;

if (keys.db.state.toUpperCase() == "DEV") {
    //FIX ME SETUP DEV CONFIG

} 
else if (keys.db.state.toUpperCase() == "PROD") {
    snsDBConfig = {
        user: keys.db.user,
        password: keys.db.password,
        server: keys.db.server, // You can use 'localhost\\instance' to connect to named instance
        database: keys.db.database,
        // driver:'msnodesqlv8',
        pool: {
            max: 20,
            min: 5,
            idleTimeoutMillis: 30000
        },
        options: {
            encrypt: false,
            instanceName: keys.db.instance,
            enableArithAbort: true
        },
        //  port:57909,
        enableArithAbort: false
    }

};



let snsDBConnection = new sql.ConnectionPool(snsDBConfig).connect()
    .then(query => {
        return query
    })
    .catch((error)=>{
        if(error.code === 18456){
            
            console.error('Invalid UserName FOR PAYROLL DB')
        }
        else{
            console.error("Database connection issue with Payroll database  ", error)
            console.log(`Terminating Server`)
            process.exit(1);
        }
    } 
        
)

console.log(snsDBConfig)




module.exports = {snsDBConnection};

