
//all middleware object goes here

var middleware={}




//Adding this class so that I can use Promises on MySQL database. This class just wraps around the function and allows me to consume the promises

middleware.isLoggedIn=function(req, res, next) {
	if (req.isAuthenticated()) {
		return next()
	}
	if (req.originalUrl != "/") {
        req.flash("message", "Please Login First!")
    }
	res.redirect("/login")
}





module.exports = middleware;