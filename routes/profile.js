const express = require("express");
const router = express.Router();
const middleware = require("../middleware/index")
const createError = require('http-errors');
const snsInvDBConnection = require('../middleware/database').snsInvDBConnection;
const database = require('../src/databaseFunctions')

router.get("/profile", middleware.isLoggedIn, async function(req, res, next) {
    try {
        let pool = await snsInvDBConnection
        let userAudit = await pool.query(`SELECT TOP 50 *  FROM SSAudit WHERE UserID = '${req.user.UserID}' ORDER BY ATimeStamp DESC`)
        userAudit = userAudit.recordset

        res.render("profile",{
            jsFileLocation:"/src/profile.js",
            userAudit
        })
    } catch (err) {
        console.trace(err.lineNumber)
        console.log(err)
        next(err)
    }

})


module.exports = router;