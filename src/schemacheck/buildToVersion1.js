const connection = require('../../middleware/database').snsDBConnection;

module.exports = async function buildCoreSchemas(){
    let pool = await connection;
    const transaction = pool.transaction()
    try
    {    
        await transaction.begin();
        const request = transaction.request()

        console.log(`CREATING VERSION 0.0.0 TABLES FOR WEB SNS DATABASE......`)

        await request.query(`CREATE TABLE DBSchemaVersion (
            DBSchemaVersionID INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_DBSchemaVersion PRIMARY KEY,
            SchemaVer VARCHAR(50) NOT NULL,
            );`)

        await transaction.commit();
        return true;

    }
    catch(err){
        await transaction.rollback()
        console.trace(err)
        return false
    }
}