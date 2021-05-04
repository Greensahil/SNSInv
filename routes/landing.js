const express = require("express");
const router = express.Router();
const middleware = require("../middleware/index")
const createError = require('http-errors');
const snsInvDBConnection = require('../middleware/database').snsInvDBConnection;
const database = require('../src/databaseFunctions')

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

        let blnBinExists = await checkToSeeIfBinExists(binNumber)

        if(!blnBinExists){
            throw createError('400',`<strong>${binNumber}</strong> does not exist`)
        }

        console.log(`SELECT * FROM qSSInv WHERE ItemLocRow='BCBIN' AND ItemLocBCBin= '${binNumber}' ORDER BY ProductItemNum;`)
        let binContents = await pool.query(`SELECT * FROM qSSInv WHERE ItemLocRow='BCBIN' AND ItemLocBCBin= '${binNumber}' ORDER BY ProductItemNum;`)
        binContents = binContents.recordset
        res.send(binContents)

    } catch (err) {
        console.trace(err.lineNumber)
        console.log(err)
        next(err)
    }

})

async function checkToSeeIfBinExists(binNumber){
    try{
        let pool = await snsInvDBConnection
        let binExists = await pool.query(`SELECT * FROM ItemLocBCBins WHERE ItemLocBCBin = '${binNumber}'`)

        if(binExists.recordset.length > 0){
            return true
        }
        else{
            return false
        }
    }
    catch (err) {
        console.trace(err.lineNumber)
        console.log(err)
        return false
    }
}

router.post("/moveBin", middleware.isLoggedIn, async function(req, res, next) {
    try {
        let pool = await snsInvDBConnection
        let binNumber = req.body.binNumber
        let fromRow =  req.body.fromRow
        let fromCol = req.body.fromCol
        let fromShelf = req.body.fromShelf
        let toRow = req.body.toRow
        let toCol = req.body.toCol
        let toShelf = req.body.toShelf

        let blnCheckIfRowExists = await checkToSeeIfRowExists(toRow)

        if(!blnCheckIfRowExists){
            throw createError('400', `<strong>${binNumber}</strong> cannot be moved to <strong>${row}</strong> because it does not exist`)
        }


        await pool.query(`UPDATE ItemLocBCBins SET ItemLocBCBinRow='${toRow}',ItemLocBCBinColumn = '${toCol}', ItemLocBCBinShelf = '${toShelf}' WHERE ItemLocBCBin = '${binNumber}'`)

        //Movement was successful, create audit
        let ssInvID = await pool.query(`SELECT * FROM SSInv WHERE ItemLocRow = 'BCBIN' AND ItemLocBCBin = '${binNumber}'`);
        ssInvID = ssInvID.recordset[0].SSInvID
        let oldLocation = getFullLocationForBCBin(fromRow, fromCol, fromShelf,binNumber)
        let newLocation = getFullLocationForBCBin(toRow, toCol, toShelf,binNumber)
        
        if(!await database.createAudit("INV","Location",oldLocation,newLocation,ssInvID,"Move BC Bin",req.user.UserName)){
            throw createError('422','Movement of bin was successful but could not create audit. Please contact admin')
        }

        res.end()

    } catch (err) {
        console.trace(err.lineNumber)
        console.log(err)
        next(err)
    }

})

router.post("/mergeBin", middleware.isLoggedIn, async function(req, res, next) {
    try {
        let pool = await snsInvDBConnection

        let sourceRow = req.body.sourceRow
        let sourceCol = req.body.sourceCol
        let sourceShelf = req.body.sourceShelf
        let sourceBin = req.body.sourceBin

        let destinationRow = req.body.destinationRow
        let destinationCol = req.body.destinationCol
        let destinationShelf = req.body.destinationShelf
        let destinationBin = req.body.destinationBin

        console.log(sourceRow, sourceCol, sourceShelf, sourceBin)
        console.log(destinationRow, destinationCol, destinationShelf, destinationBin)


        
        res.end()

    } catch (err) {
        console.trace(err.lineNumber)
        console.log(err)
        next(err)
    }

})



function getFullLocationForBCBin(row, col, shelf, bcBin){
    //A BC Bin requires a row column and shelf, so don't have to test for missing of these
    return `${row.toUpperCase()}\\${col.toUpperCase()}\\${shelf.toUpperCase()}\\${bcBin.toUpperCase()}`
}

async function checkToSeeIfRowExists(rowNumber){
    try{
        let pool = await snsInvDBConnection
        let rowExists = await pool.query(`SELECT * FROM ItemLocRows WHERE ItemLocRow = '${rowNumber}'`)

        if(rowExists.recordset.length > 0){
            return true
        }
        else{
            return false
        }
    }
    catch (err) {
        console.trace(err.lineNumber)
        console.log(err)
        return false
    }
}

module.exports = router;