var _ = require('lodash');
var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var passport = require('passport');
var User = require('../models/User');
var _ = require('lodash')

/**
 * GET /logout
 * Log out.
 */
exports.logout = function(req, res) {
  req.logout();
  res.redirect('/admin/');
};


/**
 * GET /account
 * Profile page.
 */
exports.getAccount = function(req, res) {
  if(!res.locals.user.admin){
    return res.render('account/profile', {
      title: 'Account Management'
    });
  }
  console.log('admin')
  User.find({}, function(err, results){
    return res.render('account/profile', {
      users:results,
      title: 'Account Management'
    });
  })
};

/**
 * POST /account/profile
 * Update profile information.
 */
exports.postUpdateProfile = function(req, res, next) {
  User.findById(req.user.id, function(err, user) {
    if (err) {
      return next(err);
    }
    user.email = req.body.email || '';
    user.profile.name = req.body.name || '';
    user.profile.gender = req.body.gender || '';
    user.profile.location = req.body.location || '';
    user.profile.website = req.body.website || '';
    user.save(function(err) {
      if (err) {
        return next(err);
      }
      req.flash('success', { msg: 'Profile information updated.' });
      res.redirect('/admin/account');
    });
  });
};

/**
 * POST /account/delete
 * Delete user account.
 */
exports.postDeleteAccount = function(req, res, next) {
  User.remove({ _id: req.user.id }, function(err) {
    if (err) {
      return next(err);
    }
    req.logout();
    req.flash('info', { msg: 'Your account has been deleted.' });
    res.redirect('/admin/');
  });
};

exports.updateUserAdmins = function(req, res, next){
  console.log(req.body)
  if(req.body.admins){
    if(!_.isArray(req.body.admins)){
      req.body.admins = [req.body.admins]
    }
    // iterate over all users, check against new admin list
    return User.find({}, function(err, users){
      var userUpdateFunctions = []
      var userUpdate = function(user){
        return new Promise(function(resolve, reject){
          var thisUsername = user.username
          if(req.body.admins.indexOf(thisUsername)<0){
            user.admin = false
          } else{
            user.admin = true
          }
          if(thisUsername === res.locals.user.username){
            user.admin = true
          }
          user.save(function(err, results){
            if(err) return reject(err)
            resolve()
          })
        })
      }
      _.forEach(users, function(user){
        userUpdateFunctions.push(userUpdate(user))
      })
      Promise.all(userUpdateFunctions).then(function(results){
        req.flash('info', { msg: 'Admins updated' });
        res.redirect('/admin/account')
      }).catch(function(err){
        console.error(err)
      })
    })
  }
  res.redirect('/admin/account')
}
