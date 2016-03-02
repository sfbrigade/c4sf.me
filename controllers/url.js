/**
 * GET /
 * Home page.
 */

var Url = require('../models/Urls')

module.exports = {
  route: function (req, res) {
    var searchQuery = {
      slug: req.params.slug || 'home'
    }
    Url.find(searchQuery, function (err, results) {
      if(results.length && results[0].url){
        return res.redirect(results[0].url)
      }
      res.send(200, {working:true, results:searchQuery.slug})
    })
  },
  edit: function (req, res) {
    console.log('THIS IS EEDDIT')
    if (!req.params.slug) {
      return res.render('url', {
        create:true,
        url: {
          slug:'',
          description:'',
          url:'',
          private:true
        },
        title: 'URL',
        locals:res.locals,
        postUrl: '/admin/edit'
      })
    }
    var searchQuery = {slug: req.params.slug}
    Url.find(searchQuery, function (err, results) {
      console.log(results)
      console.log('URL', req.params.slug)
      res.render('url', {
        url: results[0],
        title: 'URL',
        locals:res.locals,
        postUrl: '/admin/edit/'+ results[0].slug
      })
    })
  },
  postNewUrl: function(req, res){
    var backURL = req.header('Referer') || '/';
    console.log(req.body)
    var slug = req.body.slug
    var url = req.body.url
    var description = req.body.description
    var author = res.locals.user.username
    var private = req.body.private
    Url.find({slug:slug}, function(err, results){
      if (err) throw err
      if(results.length){
        console.log('THIS EXISTS!')
        req.flash('errors', {msg:'Shortlink '+slug+' already exists. Please choose another slug.'})
        return res.redirect('/admin/edit')
      }
      var newUrl = new Url()
      newUrl.slug = slug
      newUrl.url = url
      newUrl.description = description
      newUrl.author = author
      newUrl.private = private
      newUrl.save(function(err, results){
        if(err) throw err
        req.flash('success', {msg:'Slug: '+slug+' created successfully.'})
        res.redirect('/admin')
      })
    })
  },
  postUpdateUrl: function(req, res){
    var backURL = req.header('Referer') || '/';
    console.log(req.params)
    var oldSlug = req.params.slug
    var newSlug = req.body.slug
    if(oldSlug ==='home' && oldSlug !== newSlug){
      req.flash('errors', {msg:'Cannot change shortname for "home" shortlink.'})
      return res.redirect('/admin/edit/home')
    }
    if(newSlug.indexOf('/')>-1){
      req.flash('errors', {msg:'Cannot have a "/" in shortlink.'})
      return res.redirect(backURL)
    }
    var url = req.body.url
    var description = req.body.description
    var author = res.locals.user.username
    var private = req.body.private
    Url.find({slug:oldSlug}, function(err, results){
      if (err) throw err
      var newUrl
      if(results.length){
        newUrl = results[0]
      } else{
        var newUrl = new Url()
      }
      newUrl.slug = newSlug
      newUrl.url = url
      newUrl.description = description
      newUrl.author = author
      newUrl.private = private
      newUrl.save(function(err, results){
        if(err) throw err
        req.flash('success', {msg:'Slug: '+newSlug+' updated successfully.'})
        res.redirect('/admin')
      })
    })
  },
  postDeleteUrl: function(req, res){
    var backURL = req.header('Referer') || '/';

    var slug = req.params.slug
    if(slug ==='home'){
      req.flash('errors', {msg:'Cannot delete "home" shortlink.'})
      return res.redirect('/admin/edit/home')
    }
    Url.remove({slug:slug}, function(err){
      if(err) throw err
      req.flash('success', {msg:'Slug: '+slug+' removed successfully.'})
      res.redirect('/admin')
    })
  },
}
