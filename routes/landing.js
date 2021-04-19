const express = require("express");
const router = express.Router();
const middleware = require("../middleware/index.js")


router.get("/", middleware.isLoggedIn, async function(req, res, next) {
    try {

        let previousJobs = await getPreviousJobs(req.user.EmployeeID)
        
        res.render("landing",{
            previousJobs,
            jsFileLocation:"/src/landing.js"
        })
    } catch (err) {
        console.trace(err.lineNumber)
        console.log(err)
        next(err)
    }

})


module.exports = router;