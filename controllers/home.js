/**
 * GET /
 * Home page.
 */
var Url = require('../models/Urls')


exports.index = function (req, res) {
  var searchQuery = {private: false}
  if (res.locals.user && res.locals.user.admin) {
    console.log('THIS IS AN ADMIN')
    searchQuery = {}
  }
  Url.find(searchQuery, function (err, results) {
    console.log(results)
    console.log('URL', req.params.slug)
    res.render('home', {
      urls:results,
      locals:res.locals,
      title: 'C4Brigade'
    })
  })
}
