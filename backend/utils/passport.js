const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/User');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ 
      $or: [
        { googleId: profile.id },
        { email: profile.emails[0].value }
      ]
    });

    if (user) {
      if (!user.googleId) {
        user.googleId = profile.id;
        user.avatar = profile.photos[0].value;
        await user.save();
      }
      return done(null, user);
    }

    user = await User.create({
      googleId: profile.id,
      name: profile.displayName,
      email: profile.emails[0].value,
      avatar: profile.photos[0].value,
      password: Math.random().toString(36).slice(-8) // Random password
    });

    done(null, user);
  } catch (error) {
    done(error, null);
  }
}));

passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: "http://localhost:5000/api/auth/facebook/callback",
  profileFields: ['id', 'displayName', 'photos', 'email'] // Yêu cầu các trường cần thiết
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
    const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : null;

    if (!email) {
      // Xử lý trường hợp người dùng không cung cấp email
      return done(new Error('Facebook account does not have an email associated.'), null);
    }

    const query = { $or: [{ facebookId: profile.id }] };
    if (email) {
      query.$or.push({ email: email });
    }

    let user = await User.findOne({ 
      $or: query.$or
    });

    if (user) {
      if (!user.facebookId) {
        user.facebookId = profile.id;
        if (avatar && !user.avatar) user.avatar = avatar;
        await user.save();
      }
      return done(null, user);
    }

    user = await User.create({
      facebookId: profile.id,
      name: profile.displayName,
      email: email,
      avatar: avatar,
      password: Math.random().toString(36).slice(-8) // Random password
    });

    done(null, user);
  } catch (error) {
    done(error, null);
  }
}));    

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});