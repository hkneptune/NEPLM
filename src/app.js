// Dependencies
const express = require('express')
// Handle authentication
const passport = require('passport')
const session = require('express-session')
const bodyParser = require('body-parser')

// LDAP
const LdapStrategy = require('passport-ldapauth')

// Setting up the port
const PORT = process.env.PORT || 45675

// Database Schema
const models = require('./models')
require('./config/passport/passport.js')(passport, models.ldap_users)
// Database synchronization
models.sequelize.sync().then(() => {
  console.log('The database connection is fine!')
}).catch((err) => {
  console.log(err, "Something went wrong while connecting to the database!")
})

// Creating an express app and
// configuring middleware needed to read through our public folder
const app = express()
app.use(express.static('public'))

// For body parser
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// For Passport
app.use(session({
  secret: 'This is a secret used in session',
  resave: true,
  cookie: { maxAge: 60000 }, // 60 seconds
  saveUninitialized: true })) // Session secret
var getLdapConfiguration = {
  server: {
    url: 'ldap://127.0.0.1:389',
    bindDN: 'CN=admin,OU=neptuneli,DC=neptuneli,DC=com',
    bindCredentials: 'PasswordHere',
    searchBase: 'OU=Users,OU=neptuneli,DC=neptuneli,DC=com',
    searchFilter: '(CN={{username}})'
  },
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
}
passport.use(new LdapStrategy(getLdapConfiguration, (req, user, done) => {

  if (!user.display_name) {
    models.ldap_users.findOrCreate({
      where: {
        id: user.name.toLocaleUpperCase()
      },
      defaults: {
        id: user.name.toLocaleUpperCase(),
        display_name: user.displayName,
        first_name: user.givenName,
        last_name: user.sn.toLocaleUpperCase(),
        title: user.title,
        email: user.mail,
        email_aliases: user.proxyAddresses.filter((item, index, array) => { return item.toLocaleLowerCase().startsWith('smtp'); }).toString().toLocaleLowerCase().replace(/smtp:/g, ''),
        department: user.department,
        company: user.company,
        joined: user.whenCreated.substring(0, 14),
        last_login: new Date()
      }
    }).then(([records, created]) => {

      if (!created) {
        records.update({
          last_login: new Date()
        })
      }

      let newUser = records.get({
        plain: true
      })

      done(null, newUser)
    })
  }
}))

app.use(passport.initialize())
app.use(passport.session()) // Persistent login sessions

function isLoggedIn(req, res, next) {
  return req.isAuthenticated() ? next() : res.redirect('/user/login?login=0')
}

function isLoggedOut(req, res, next) {
  return req.isAuthenticated() ? res.redirect('/dashboard') : next()
}

function showHomeButton(isMember) {
  return isMember ? '<a href="/">Home</a><br /><a href="/dashboard">Dashboard</a><br />' : '<a href="/">Home</a><br />'
}

function showAuthButtons(isMember) {
  return isMember ? '<a href="/user/logout">Logout</a><br />' : '<a href="/user/register">Register</a><br /><a href="/user/login">Login</a><br />'
}

function showUserName(user) {
  return user ? 'Hello, <strong>' + user.display_name + '</strong>!<br />' : 'Hello, <strong>Anonymous</strong>!<br />'
}

app.get('/', (req, res) => {
  return res.send(showHomeButton(req.user) + showAuthButtons(req.user) + showUserName(req.user))
})

app.get('/user/login', isLoggedOut, (req, res) => {
  res.send(showHomeButton(req.user) + showAuthButtons(req.user) + showUserName(req.user) + '<br /><form id="signin" name="signin" method="post" action="/api/auth/signin"><label for="email">Email Address</label>&nbsp;<input class="text" name="email" type="text" /><br /><label for="password">Password</label>&nbsp;<input name="password" type="password" /><br /><input class="btn" type="submit" value="Sign In" /></form>')
})

app.get('/dashboard', isLoggedIn, (req, res) => {
  res.send(showHomeButton(req.user) + showAuthButtons(req.user) + showUserName(req.user))
})

app.post('/api/auth/signin', passport.authenticate('ldapauth', {
  session: true,
  successRedirect: '/dashboard',
  failureRedirect: '/user/login?fail=1'
}))

app.get('/user/logout', (req, res) => {
  req.session.destroy((err) => {
    res.redirect('/?logout=1')
  })
})

// Listen to and show all activities on terminal
app.listen(PORT, (err) => {
  console.log('> Project NEPM is listening on port ' + PORT + '!')
  console.log('-------------------------------------------------------')
})
