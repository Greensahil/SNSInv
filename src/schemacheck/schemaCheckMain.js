let CurDBSchema = "0.0.1"
const connection = require('../../middleware/database').snsWebDBConnection;
// const database = require('../databaseFuntions')
const buildVersion0 = require('./buildToVersion1.js')


async function CheckDBSchemaOK() {
    try {

        //console.log(rows) //Returns [ RowDataPacket { '1': 1 } ] if the DBSchemaVersion table exists
        //No error means that the database is not empty and there is a DBSchemaVersion table. So continue ....

        let dbSchema = await GetSchemaVersion()

        if (dbSchema != "ERROR") {
            console.log(`Current Schema Version is ${dbSchema} for SnSWebDB`)
            if (dbSchema != CurDBSchema) {
                if (await DoSchemaUpdate()) {
                    console.log(`New Schema Version is ${CurDBSchema}`)
                    console.log(`SCHEMA UPDATE SUCCESSFUL`)
                }
            }
        }

    } catch (err) {
        console.trace(err.lineNumber)
        console.trace(err)
    }
}

CheckDBSchemaOK()

async function DoSchemaUpdate() {
    try {
        if (await GetSchemaVersion() == "0.0.0") {
            console.log(`Updating to new schema version 0.0.1`)
            if (!await UpdateSchema_0_0_1()) {
                throw err;
            }
            console.log("New Schema Version 0.0.1")
            console.log("DATABASE READY")
        }
    } catch (err) {
        console.trace(err.lineNumber)
        console.trace("There was an error updating to new schema version")
    }
}


async function GetSchemaVersion() {
    let pool = await connection
    try {
        let schVer = await pool.query(`Select SchemaVer from DBSchemaVersion `)
        return schVer.recordset[0].SchemaVer
    } catch (err) {
        if (err.code == 'EREQUEST') {
            console.log(`DBSchemaVersion table not found. Building from ground up....`)
            if (await buildVersion0()) {
                console.log(`Databaase version 0.0.0 Built`)
                await pool.query(`Insert into dbschemaversion(SchemaVer) values('0.0.0')`)
                console.log(`New Schema version set to 0.0.0`)
                console.log("DATABASE READY")
                return "0.0.0"
            } else {
                console.trace(`COULD NOT BUILD DATABASE VERSION 0.0.0`)
                return "ERROR"
            }
        } else if (err.code == 'ER_BAD_DB_ERROR') {
            console.trace('DATABASE DOES NOT EXIST!!')
            return "ERROR"
        } else {
            console.trace(err.lineNumber)
            console.trace(err)
            //throw err
        }

    }
}

async function SetSchemaVersion(strCurVer) {
    let pool = await connection;
    await pool.query(`Update DBSchemaVersion set SchemaVer = '${strCurVer}' `)
        .catch(err => {
            console.log(err)
        })
    console.log(`Database ready`)
}


async function UpdateSchema_0_0_1() {

    let pool = await connection;
    let transaction = pool.transaction()
    try {
        await transaction.begin();
        const request = transaction.request()

        await request.query(`CREATE TABLE Users (
            UserID VARCHAR(15) NOT NULL CONSTRAINT PKID_Users PRIMARY KEY,
            UserName VARCHAR(50) NOT NULL,
            PasswordHash varchar(100),
            Pin varchar(10),
            ActiveDirectoryAuth BIT NOT NULL DEFAULT 0
        );`)
        
        await request.query(`CREATE PROCEDURE usp_web_getUserInfo(@userID as VARCHAR(15)) AS
                            SELECT * FROM Users where UserID = @userID
        `)

        await request.query(`CREATE PROCEDURE usp_web_verifyUser(@userID as varchar(20), @passwordHash as varchar(100)) AS
        SELECT * FROM Users where userID = @userID and passwordHash = @passwordHash`)
        
        await request.query(`CREATE PROCEDURE usp_web_createLocalUserFromAD(@userID as varchar(20),@passwordHash as varchar(70)) AS
        Insert into Users(UserID, UserName,PasswordHash,ActiveDirectoryAuth) values(@userID, @userID,@passwordHash,1)`)
        

        //FIX ME - REMOVE IN PRODUCTION
        await request.query(`
        INSERT INTO USERS(UserID, UserName, PIN)
        VALUES('Admin','Admin', 9874);`)    

        await SetSchemaVersion("0.0.1")

        await transaction.commit();

        return true

    } catch (err) {
        await transaction.rollback()
        console.trace(err.lineNumber)
        console.log(err)
        return false

    }
}