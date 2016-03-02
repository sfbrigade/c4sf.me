/**
 * Module dependencies.
 */
var express = require('express')
var cookieParser = require('cookie-parser')
var compress = require('compression')
var session = require('express-session')
var bodyParser = require('body-parser')
var logger = require('morgan')
var errorHandler = require('errorhandler')
var lusca = require('lusca')
var methodOverride = require('method-override')
var dotenv = require('dotenv')
var MongoStore = require('connect-mongo/es5')(session)
var flash = require('express-flash')
var path = require('path')
var mongoose = require('mongoose')
var passport = require('passport')
var expressValidator = require('express-validator')
var sass = require('node-sass-middleware')
var multer = require('multer')
var upload = multer({ dest: path.join(__dirname, 'uploads') })
var fs = require('fs')
var path = require('path')

var DB_INSTANTIATED

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 *
 * Default path: .env (You can remove the path argument entirely, after renaming `.env.example` to `.env`)
 */
try {
  var stats = fs.lstatSync(path.join(__dirname, '/.env'))
  if (stats.isFile()) {
    dotenv.load({ path: '.env' })
  } else {
    throw new Error('.env is not a file!')
  }
} catch (e) {
  console.warn(e)
  console.warn('.env file not found. Defaulting to sample. Please copy .env.example to .env and populate with your own credentials.')
  dotenv.load({ path: '.env.example' })
}
/**
 * Controllers (route handlers).
 */
var homeController = require('./controllers/home')
var userController = require('./controllers/user')
var urlController = require('./controllers/url')

/**
 * API keys and Passport configuration.
 */
var passportConfig = require('./config/passport')

/**
 * Create Express server.
 */
var app = express()

/**
 * Connect to MongoDB.
 */
mongoose.connect(process.env.MONGODB || process.env.MONGOLAB_URI)
mongoose.connection.on('error', function () {
  console.log('MongoDB Connection Error. Please make sure that MongoDB is running.')
  process.exit(1)
})

var Url = require('./models/Urls')
/**
 * Express configuration.
 */
app.set('port', process.env.PORT || 9996)
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')
app.use(compress())
app.use(sass({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  sourceMap: true
}))
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(expressValidator())
app.use(methodOverride())
app.use(cookieParser())
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET,
  store: new MongoStore({
    url: process.env.MONGODB || process.env.MONGOLAB_URI,
    autoReconnect: true
  })
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())
app.use(function (req, res, next) {
  if (req.path === '/api/upload') {
    next()
  } else {
    lusca.csrf()(req, res, next)
  }
})
app.use(lusca.xframe('SAMEORIGIN'))
app.use(lusca.xssProtection(true))
app.use(function (req, res, next) {
  res.locals.user = req.user
  next()
})
app.use(function (req, res, next) {
  if (/api/i.test(req.path)) {
    req.session.returnTo = req.path
  }
  next()
})
app.use(function (req, res, next) {
  if(req.subdomains.length){
    req.params.slug = req.subdomains[0]
  }
  res.locals.host = req.protocol + "://"+ req.get('host')
  if(res.locals.host === 'http://localhost' || res.locals.host === 'http://127.0.0.1'){
    res.locals.host = app.get('port')
  }
  next()
})
/* Check if db is connected */
app.use(checkDB)
function checkDB (req, res, next) {
  if (!DB_INSTANTIATED) {
    return setTimeout(function () {
      checkDB(req, res, next)
    }, 500)
  }
  next()
}
app.use('/public', express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }))

/**
 * Primary app routes.
 */
app.get('/', urlController.route)
app.get('/admin', homeController.index)
app.get('/admin/', homeController.index)
app.get('/admin/logout', userController.logout)
app.get('/admin/account', passportConfig.isAuthenticated, userController.getAccount)
app.get('/admin/edit', passportConfig.isAuthenticated, urlController.edit)
app.get('/admin/edit/:slug', passportConfig.isAuthenticated, urlController.edit)
app.post('/admin/edit', passportConfig.isAuthenticated, urlController.postNewUrl)
app.post('/admin/edit/:slug', passportConfig.isAuthenticated, urlController.postUpdateUrl)
app.post('/admin/edit/:slug/delete', passportConfig.isAuthenticated, urlController.postDeleteUrl)
app.post('/admin/account/profile', passportConfig.isAuthenticated, userController.postUpdateProfile)
app.post('/admin/account/delete', passportConfig.isAuthenticated, userController.postDeleteAccount)
app.post('/admin/users', passportConfig.isAuthenticated, userController.updateUserAdmins)

app.get('/admin/auth/github', passport.authenticate('github'))
app.get('/admin/auth/github/callback', passport.authenticate('github', { failureRedirect: '/admin/' }), function (req, res) {
  res.redirect(req.session.returnTo || '/admin/')
})

Url.find({slug: 'home'}, function (err, results) {
  if (err) throw err
  if (!results.length) {
    console.log('No home url set. Setting to default value, http://codeforamerica.org.')
    var defaultUrlData = {
      slug: 'home',
      url: 'http://codeforamerica.org',
      description: 'Code for America Homepage',
      author: '',
      private: false
    }
    var defaultUrl = new Url(defaultUrlData)
    defaultUrl.save(function (err) {
      if (err) throw err
      console.log('Default Url populated into database.')
      DB_INSTANTIATED = true
      startServer()
    })
  } else {
    DB_INSTANTIATED = true
    startServer()
  }
})
function startServer () {
  app.get('/:slug', urlController.route)

  app.use(errorHandler())

  app.listen(app.get('port'), function () {
    console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'))
  })
}

module.exports = app
