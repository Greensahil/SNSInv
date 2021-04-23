// const database = require('../src/databaseFunctions');

let handleError = (error, req, res, next) => {
    // Sets HTTP status code
    //Fallback to 500 Internal Server Error
    // res.status(error.status|| 500)
    // Sends response
    res.status(error.status|| 500).json({
      status: error.status||500,
      message: error.message,
      stack: error.stack
    })
    //database.logError(error.status,error.message,error.stack,(req.user)?req.user.employeeID:-1)
    //next()
}

module.exports = handleError