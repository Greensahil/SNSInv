const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser')
const flash = require('connect-flash')
const keys = require('./config/keys')
const dotenv = require('dotenv');
const session = require("express-session")
const passport = require('passport');
const fs = require('fs');
const https = require('https');
const http = require('http')
//const database = require('./src/databaseFuntions')
require('./src/schemacheck/schemaCheckMain')
const handleError = require('./src/handleError')

dotenv.config();

app.set("view engine", "ejs")
app.use(morgan('dev'))

app.use(bodyParser.json({
    limit: '50mb'
}));
app.use(bodyParser.urlencoded({
    limit: '50mb',
    extended: true
}));

app.use(flash())

app.enable('trust proxy');


app.use (function (req, res, next) {
    if (req.secure) {
            // request was via https, so do no special handling
            console.log(`Secure request`)
            next();
    } else {
            //request was via http, so redirect to https
            console.log(`Unsecure request`)
            res.redirect('https://' + req.headers.host + req.url);
    }
});


app.use(express.static(__dirname + "/public"));
app.use(express.static(__dirname + "/public/src"));

const passportConfig = require('./routes/passport');
passportConfig(passport);


app.use(require("cookie-session")({
    secret:keys.session.secret,
    resave:false,
    saveUninitialized:false

}));

app.use(passport.initialize());
app.use(passport.session())


//Setup flash middleware
app.use(async function (req, res, next) {
    try{
        res.locals.currentUser = req.user;
        res.locals.error = req.flash("error");
        res.locals.success = req.flash("success");
        res.locals.message = req.flash("message");
        res.locals.invalidAuth = req.flash("invalidAuth");
        
        
        next()
    }
    catch(err){
        next(err)
    }
})

//Routes

const landing = require('./routes/landing.js');
const authenticate = require('./routes/auth.js')


app.use(landing)
app.use(authenticate)


//Custom error handling middleware. Express will not use its default error handling middleware if this is present
app.use((error, req, res, next)=>{
    handleError(error, req, res, next)
})


https.createServer({
    key: fs.readFileSync('./ssl/private.key'),
    ca:fs.readFileSync('./ssl/ca_bundle.crt'),
    cert: fs.readFileSync('./ssl/certificate.crt')
}, app).listen(443);

http.createServer(app).listen(80);


process.on('unhandledRejection', (error, p) => { //I added this so that I can console log the unhandled rejection and where it is coming from. Before this I would just get UnhandledPromiseRejectionWarning: Unhandled promise rejection without knowing which promise was not handled
    console.log('=== UNHANDLED REJECTION ==='); // Not good to have undhandled promise rejection in code. This will just help me locate it incase here is one
    console.dir(error.stack);
});
