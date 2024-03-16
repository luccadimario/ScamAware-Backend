const passport = require('passport')
const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
const fs = require("fs");
const path = require('path');
var pathToJson = path.resolve(__dirname, './credentials.json');
const config = JSON.parse(fs.readFileSync(pathToJson));

passport.use(new GoogleStrategy({
        clientID: config.installed.client_id,
        clientSecret: config.installed.client_secret,
        callbackURL: "https://localhost:3001/auth/google/callback",
        passReqToCallback   : true
  },
  function(request, accessToken, refreshToken, profile, otherTokenDetails, done) {
      //in here you can access all token details to given API scope
      //and I have created file from that details
      let tokens = {
          access_token: accessToken,
          refresh_token: refreshToken,
          scope: otherTokenDetails.scope,
          token_type: otherTokenDetails.token_type,
          expiry_date:otherTokenDetails.expires_in
      }
      let data = JSON.stringify(tokens);
      fs.writeFileSync('./tokens.json', data);


      //you will get a "user" object which will include the google id, name details,
      //email etc, using that details you can do persist user data in your DB or can check
      //whether the user already exists

      //after persisting user data to a DB call done
      //better to use your DB user objects in the done method

      done(null, profile);
  }
));

passport.serializeUser(function(user, done)  {
    done(null, user)
})

passport.deserializeUser(function(user, done)  {
    done(null, user)
})