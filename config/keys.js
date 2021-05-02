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
        user:process.env.db_prod_user,
        password:process.env.db_prod_password,
        server:process.env.db_prod_server ,
        webDatabase:process.env.db_prod_Webdatabase,
        invDatabase:process.env.db_prod_Invdatabase,
        instance:process.env.db_prod_instanceName,
        state:process.env.dbState
    },
    session:{
        secret:process.env.session_secret
    }
}