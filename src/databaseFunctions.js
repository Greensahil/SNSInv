const snsInvDBConnection = require('../middleware/database').snsInvDBConnection;
let database = {}

database.createAudit = async function createAudit(auditType, fieldName, oldValue, newValue, key, note, userID){
    try{
		let pool = await snsInvDBConnection
      console.log(`INSERT INTO SSAudit (AType, FKey, UserID, ATimeStamp, FieldName, OLDVALUE, NEWVALUE, Notes) 
      VALUES('${auditType}', '${key}', '${userID}', 'GETDATE()', '${fieldName}', '${oldValue}', '${newValue}', '${note}')
      `)
        await pool.query(`INSERT INTO SSAudit (AType, FKey, UserID, ATimeStamp, FieldName, OLDVALUE, NEWVALUE, Notes) 
                         VALUES('${auditType}', '${key}', '${userID}', GETDATE(), '${fieldName}', '${oldValue}', '${newValue}', '${note}')
        `)
        return true

    }
    catch(err){
		console.trace(err.lineNumber)
		console.log(err)
		return false
    }
}



module.exports = database

