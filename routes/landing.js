const express = require("express");
const router = express.Router();
const middleware = require("../middleware/index")
const createError = require('http-errors');
const snsInvDBConnection = require('../middleware/database').snsInvDBConnection;

router.get("/", middleware.isLoggedIn, async function(req, res, next) {
    try {
        res.render("landing",{
            jsFileLocation:"/src/landing.js"
        })
    } catch (err) {
        console.trace(err.lineNumber)
        console.log(err)
        next(err)
    }

})
router.post("/getBinContents", middleware.isLoggedIn, async function(req, res, next) {
    try {
        let pool = await snsInvDBConnection
        let binNumber = req.body.binNumber

        let binContents = await pool.query(`SELECT * FROM qSSInv WHERE ItemLocRow='BCBIN' AND ItemLocBCBin= '${binNumber}' ORDER BY ProductItemNum;`)
        binContents = binContents.recordset
        res.send(binContents)

    } catch (err) {
        console.trace(err.lineNumber)
        console.log(err)
        next(err)
    }

})

module.exports = router;