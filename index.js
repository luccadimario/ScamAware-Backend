const express = require("express")
//import passport_setup.js
const passportSetup = require('./auth')
const cookieSesion = require('cookie-session');
const passport = require("passport");
//import google api
const { google } = require('googleapis');
//read credentials file you obtained from google developer console
const fs = require("fs");
const path = require('path');
var pathToJson_1 = path.resolve(__dirname, './credentials.json');
const credentials = JSON.parse(fs.readFileSync(pathToJson_1));
const https = require('https');
const key = fs.readFileSync('./certs/key.pem');
const cert = fs.readFileSync('./certs/cert.pem');
require('./auth');

function isLoggedIn(req, res, next) {
    req.user ? next() : res.sendStatus(401);
}

const getMessages = async(gmail) => {
    const response = await gmail.users.messages.list({userId: 'me'})
    console.log(response);

    return response;
}

const app = express()
app.use(cookieSesion({
    name:'Reserve It',
    maxAge: 1*60*60*1000,
    keys: ['ranmalc6h12o6dewage']
}))

app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
    res.send('<a href="/auth/google">Authenticate with Google</a>');
});

app.get('/auth/google',
    passport.authenticate('google',
        { scope: ['profile',
                'email',
                'https://mail.google.com/',
                'https://www.googleapis.com/auth/gmail.readonly',
                'https://www.googleapis.com/auth/gmail.modify',
                'https://www.googleapis.com/auth/gmail.compose',
                'https://www.googleapis.com/auth/gmail.send',],
                accessType: 'offline',
                prompt: 'consent'})
);

app.get('/protected', isLoggedIn, (req, res) => {
    console.log("Here!");
    res.send(`Hello ${req.user.displayName}`);
})

/*app.get('/auth/google/callback',
    passport.authenticate('google', {
        successRedirect: '/protected',
        failureRedirect: '/auth/failure'
    })
);*/

//redirected route after obtaining 'code' from user authentication with API scopes
app.get("/auth/google/callback", passport.authenticate('google'), async(req, res) => {

    try {
        //read token file you saved earlier in passport_setup.js
        var pathToJson_2 = path.resolve(__dirname, './tokens.json');
        //get tokens to details to object
        const tokens = JSON.parse(fs.readFileSync(pathToJson_2));
        //extract credential details
        const { client_secret, client_id, redirect_uris } = credentials.installed

        //make OAuth2 object
        const oAuth2Client = new google.auth.OAuth2(client_id,
            client_secret,
            redirect_uris[0])

        // set token details to OAuth2 object
        oAuth2Client.setCredentials(tokens)

        //create gmail object to call APIs
        const gmail = google.gmail({ version: 'v1', auth: oAuth2Client })

        //call gmail APIs message send method
        const messages = await getMessages(gmail)

        res.status(200).json({ messages: messages })

    } catch (err) {
        res.status(500).json(err)
    }

})

app.get('/auth/failure', (req, res) => {
    res.send('something went wrong...');
});

app.get('/logout', (req, res) => {
    req.logout();
    req.session.destroy();
    res.send('Goodbye!')
});


// start the server
const PORT = 3001

const server = https.createServer({key: key, cert: cert }, app);
server.listen(PORT, () => { console.log('listening on 3001') });

module.exports = app


/*app.use(Cors());

// for parsing application/json
app.use(express.json())

// for parsing application/xwww-form-urlencoded
app.use(express.urlencoded({ extended: true }))

// gmail auth routes
app.use('/', authRoutes)

// auth middleware for api routes
app.use(authMiddleware)

// gmail api routes
app.use('/api', apiRoutes)*/