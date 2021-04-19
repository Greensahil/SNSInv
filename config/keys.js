const dotenv=require('dotenv')

dotenv.config()

dbState = process.env.dbState.toLowerCase();
console.log(`The database state is ${dbState}`)



module.exports={
    activeDirectory:{
        url:process.env.adURL,
        baseDN:process.env.adbaseDN
    },
    db:{
        dev_user:process.env.db_dev_user,
        dev_password:process.env.db_dev_password,
        dev_server:process.env.db_dev_server ,
        dev_database:process.env.db_dev_database,
        dev_equipmentDatabase:process.env.db_dev_equipmentdb,
        dev_roeseJobsdb:process.env.db_dev_roeseJobsdb,
        dev_instanceName:process.env.db_dev_instanceName,
        dev_foundationdb:process.env.db_foundationdb_database,
        state:process.env.dbState,
        prod_rrcsql01_server:process.env.db_rrcsql_server,
        prod_rrcsql01_user:process.env.db_rrcsql_user,
        prod_rrcsql01_password:process.env.db_rrcsql_password,
        prod_rrcsql_instanceName:process.env.db_rrcsql_instanceName,
        prod_rrcsql01_equipmentDB:process.env.db_rrcsql_equipmentdb_database,
        prod_roeseJobsDB:process.env.db_roeseJobsdb_database
    },
    session:{
        secret:process.env.session_secret
    },
    connection:{
        password:(dbState == "prod") ? process.env.db_prod_password :process.env.db_dev_password,
        user:(dbState== "prod") ? process.env.db_prod_user:process.env.db_dev_user,
        host:(dbState== "prod") ? process.env.db_prod_host:process.env.db_dev_host,
        database:(dbState== "prod") ? process.env.db_prod_database:process.env.db_dev_database
    }
}