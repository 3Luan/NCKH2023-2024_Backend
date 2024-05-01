const GoogleStrategy = require("passport-google-oauth20").Strategy;
const passport = require("passport");
require("dotenv").config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
      scope: ["email", "profile"],
    },
    function (accessToken, refreshToken, profile, cb) {
      console.log(process.env.GOOGLE_CLIENT_ID);
      console.log(process.env.GOOGLE_CLIENT_SECRET);
      return cb(profile);
    }
  )
);
