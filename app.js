const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const cors = require('cors');
const passportJWT = require('passport-jwt');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
//const swaggerDoc = require('./docs/swagger.json');
const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

// create express app & set all content to json
const app = express();
app.use(bodyParser.json());
app.use(cookieParser());

// db conn
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

mongoose.connect(process.env.CONNECTION_STRING, {})
.then((res) => { console.log ('Connected to MongoDB'); })
.catch((err) => { console.log (`DB Connection Failed ${err}`); });

// enable CORS for angular client app BEFORE controllers
app.use(cors({
    origin: process.env.CLIENT_URL,
    methods: 'GET,POST,PUT,DELETE,HEAD,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type,Authorization'
}));

// passport config BEFORE routers
app.use(session({
    secret: process.env.PASSPORT_SECRET,
    resave: true,
    saveUninitialized: false
  }));
  
app.use(passport.initialize());
app.use(passport.session());

// link passport to User model
const User = require('./models/user');
passport.use(User.createStrategy());

// link User model w/passport session mgmt
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// setup JWT Options
let JWTStrategy = passportJWT.Strategy;
let ExtractJWT = passportJWT.ExtractJwt;

let jwtOptions = 
{
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.PASSPORT_SECRET
}

// setup JWT Strategy
let strategy = new JWTStrategy(jwtOptions, function(jwt_payload, done)
{
    try 
    {
        const user = User.findById(jwt_payload.id);
        if (user) 
        {
            return done(null, user);
        }
        return done(null, false);
    } 
    catch (error) 
    {
        return done(error, false);
    }
});

passport.use(strategy);

// map routes
const postsController = require('./controllers/posts');
const usersController = require('./controllers/users');
app.use('/v1/api/posts', postsController);
app.use('/v1/api/users', usersController);

const options = {
    swaggerDefinition: {
        info: {
            title: 'Blog API',
            version: '1.0.0',
            description: 'In-Class Express API'
        }
    },
    apis: [path.join(__dirname, '/controllers/*.js')]
};
const swaggerSpecs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

app.use(express.static(__dirname + '/public'));
app.get('*', (req, res) => { res.sendFile(__dirname + '/public/index.html')});

// start server
app.listen(3000);
module.exports = app;