const express = require("express");
const router = express.Router();
const passport = require('passport')
const bouncer = require ("express-bouncer")(500, 900000);


//Prevent brute force auth

// for(let i =0;i<100;i++){
//     $( "input[name='username']").val('asdsad')
//     $( "input[name='password']").val('asdsad')
//     $("button").click()
// }


// Custom error message (optional)
bouncer.blocked = function (req, res, next, remaining)
{
	// res.send (429, "Too many requests have been made, " +
    // 	"please wait " + remaining / 1000 + " seconds");
    req.flash('invalidAuth', "Too many requests have been made, " +
    	"please wait " + remaining / 1000 + " seconds")
    res.redirect("/login")

};

router.get("/login",async (req,res)=>{
    try{
        //Does this user have windows authentication
        // rows = await pool
        // let windowsUserName = await rows.query(`select nt_username as UserName from master.sys.sysprocesses where spid = @@spid`)
        // windowsUserName = windowsUserName.recordset[0]
        // res.render("login",{windowsUserName})

            if(!req.user){
                res.render("login")     
            }
            else{
                //User is already logged in but is still trying to access the login page
				req.flash("success","You are already logged in!")
				res.redirect('back')
            }
           
    }
    catch(err){
        console.log(err)
    }
    
})


// router.post("/login", function(req,res,next){
//     passport.authenticate("user-login", function(err,user,info){
//         console.log(err)
//         if(err){
//             res.redirect("/login")
//         }
//         else{
//             res.redirect("/")
//         }


//     })(req,res,next);
// })


router.post("/login",bouncer.block, passport.authenticate("user-login", {
	successRedirect: "/",
	failureRedirect: "/login"
}), function (req, res) {});


router.get("/logout", function (req, res) {
	req.logout()
    req.flash('success', 'You are Logged Out')
	res.redirect("/login")
})

// Clear all logged addresses
// (Usually never really used)
bouncer.addresses = { };





module.exports = router;
