var _ = require('lodash');
var passport = require('passport');
var request = require('request');
var InstagramStrategy = require('passport-instagram').Strategy;
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var GitHubStrategy = require('passport-github').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
var OpenIDStrategy = require('passport-openid').Strategy;
var OAuthStrategy = require('passport-oauth').OAuthStrategy;
var OAuth2Strategy = require('passport-oauth').OAuth2Strategy;

var User = require('../models/User');

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

/**
 * Sign in with GitHub.
 */
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_ID,
  clientSecret: process.env.GITHUB_SECRET,
  callbackURL: '/admin/auth/github/callback',
  passReqToCallback: true
}, function(req, accessToken, refreshToken, profile, done) {
  if (req.user) {
    User.findOne({ github: profile.id }, function (err, existingUser) {
      if (err) console.error(err)
      if (existingUser) {
        req.flash('errors', { msg: 'There is already a GitHub account that belongs to you. Sign in with that account or delete it, then link it with your current account.' })
        done(err)
      } else {
        User.findById(req.user.id, function (err, user) {
          if (err) console.error(err)
          user.github = profile.id
          user.username = profile.username
          user.tokens.push({ kind: 'github', accessToken: accessToken })
          user.profile.name = user.profile.name || profile.displayName
          user.profile.picture = user.profile.picture || profile._json.avatar_url
          user.profile.location = user.profile.location || profile._json.location
          user.profile.website = user.profile.website || profile._json.blog
          User.count({}, function (err, count) {
            if (err) console.error(err)
            if (!count) {
              user.admin = true
            }
            user.save(function (err) {
              if (err) console.error(err)
              req.flash('info', { msg: 'GitHub account has been linked.' })
              done(err, user)
            })
          })
        })
      }
    })
  } else {
    User.findOne({ github: profile.id }, function(err, existingUser) {
      if (existingUser) {
        return done(null, existingUser);
      }
      User.findOne({ username: profile.username }, function(err, existingEmailUser) {
        if (existingEmailUser) {
          req.flash('errors', { msg: 'There is already an account using this email address. Sign in to that account and link it with GitHub manually from Account Settings.' });
          done(err);
        } else {
          var user = new User();
          user.github = profile.id
          user.username = profile.username
          user.tokens.push({ kind: 'github', accessToken: accessToken })
          user.profile.name = user.profile.name || profile.displayName
          user.profile.picture = user.profile.picture || profile._json.avatar_url
          user.profile.location = user.profile.location || profile._json.location
          user.profile.website = user.profile.website || profile._json.blog
          User.count({}, function (err, count) {
            if (err) console.error(err)
            if (!count) {
              user.admin = true
            }
            user.save(function (err) {
              if (err) console.error(err)
              req.flash('info', { msg: 'GitHub account has been linked.' })
              done(err, user)
            })
          })
        }
      });
    });
  }
}));

/**
 * Login Required middleware.
 */
exports.isAuthenticated = function(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/admin');
};
exports.isAdmin = function(req, res, next) {
  if (req.user.admin) {
    return next();
  }
  res.redirect('/admin');
};
/**
 * Authorization Required middleware.
 */
exports.isAuthorized = function(req, res, next) {
  var provider = req.path.split('/').slice(-1)[0];

  if (_.find(req.user.tokens, { kind: provider })) {
    next();
  } else {
    res.redirect('/admin/auth/' + provider);
  }
};
