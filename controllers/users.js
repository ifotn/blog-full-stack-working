const express = require('express');
const router = express.Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const passport = require('passport');

const generateToken = (user) =>
{
    const payload =
    {
        id: user._id,
        username: user.username,
    };
    
    const jwtOptions =
    {
        expiresIn: '1hr' // 1 week
        // Note: this may be made considerably shorter for security purposes
    };

    return jwt.sign(payload, process.env.PASSPORT_SECRET, jwtOptions);
}

const setTokenCookie = (res, token) => {
    res.cookie('authToken', token, {
        httpOnly: true,
        secure: true, //process.env.NODE_ENV === 'production',
        sameSite: 'None',
    });
};
  
const clearTokenCookie = (res) => {
    //let expiryDate = new Date(Number(new Date()) + 315360000000); 
    //res.cookie('authToken', 'en', { expires: expiryDate, httpOnly: true });
    //res.clearCookie('authToken');
    //res.cookie('authToken', '', {maxAge: 0});
    res.cookie('authToken', '', {
        httpOnly: true,
        expires: new Date(0), // Set to a date in the past to expire the cookie
      });
    console.log(res.cookie('authToken'));
};

const verifyToken = (req) => {
    console.log('verify start');
    const token = req.cookies.authToken;
    console.log('token: ' + token);
    if (!token) {
        console.log('token undefined');
        return 'undefined';
    }
    else {
        const decode = jwt.verify(token, process.env.PASSPORT_SECRET);
        console.log('decode: ' + decode);
        return decode.username;
    }
}

router.post('/register', (req, res, next) => {
    // instantiate a new user object
    let newUser = new User
    ({
        username: req.body.username
    });

    User.register(newUser, req.body.password, (err) =>
    {
        //console.log(`registering user: ${newUser}`);
        if (err)
        {
            if (err.name == 'UserExistsError')
            {
                console.error('ERROR: User Already Exists');
                return res.status(400).json({success: false, msg: 'ERROR: User Already Exists'});
            }
            console.error(err.name); // other error
            return res.status(400).json({success: false, msg: 'ERROR: Registration Failure'});
        }
        return res.status(200).json({success: true, msg: 'User Registered Successfully'});
    });
});

router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) =>
    {
        // are there server errors?
        if (err)
        {
            console.error(err);
            return res.status(500).json({success: false, msg: err});
        }

        // are there login errors?
        if (!user)
        {
            return res.status(401).json({success: false, msg: 'ERROR: Authentication Error'});
        }

        req.logIn(user, (err) =>
        {
            // are there db errors?
            if (err)
            {
                console.error(err);
                return res.status(401).json({success: false, msg: 'ERROR: Authentication Error'});
            }

            const authToken = generateToken(user);
            setTokenCookie(res, authToken);

            return res.status(200).json({success: true, msg: 'User Logged In Successfully', user: {
                id: user._id,
                username: user.username,
            }, token: authToken});
        });
        return;
    })(req, res, next);
});

router.get('/logout', (req, res, next) => {
    console.log('starting logout...');
    try {
        req.logout((err) => {
            if (err) {
                console.log(err);
                return res.status(400).json({msg: err});
            }
            else {    
                //clearTokenCookie(res);
                console.log('User Logged Out');
                return res.status(200).json({success: true, msg: 'User Logged out Successfully'});
            }
            
            // Note: the client will need remove the token 
        });

        
    }
    catch (error) {
        console.log(error);
        return res.status(400).json({msg: error});
    }

    
    
});

router.get('/signout', (req, res, next) => {
    console.log(req.user);
    req.logout((err) => {
        if (err) {
            console.log(err);
            return res.status(400).json({msg: err});
        }
        else {
            clearTokenCookie(res);
            console.log('signed out');
            return res.status(200).json({msg: 'signed out'});
        }
    });
});
module.exports = router, verifyToken;
