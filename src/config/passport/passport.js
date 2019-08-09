const bcrypt = require('bcryptjs')
const PassportStrategy = require('passport-local')
const LdapStrategy = require('passport-ldapauth')

module.exports = (passport, user) => {

  let User = user
  let LocalStrategy = PassportStrategy.Strategy

  // Determines which data of the user object should be stored in the session.
  // The result of the serializeUser method is attached to the session as
  // req.session.passport.user = {}
  // https://stackoverflow.com/questions/27637609
  // https://hackernoon.com/passportjs-the-confusing-parts-explained-edca874ebead
  passport.serializeUser((user, done) => {
    done(null, user)
  })

  // The first argument of deserializeUser corresponds to the key of the user
  // object that was given to the done function.
  // https://stackoverflow.com/questions/27637609
  // https://hackernoon.com/passportjs-the-confusing-parts-explained-edca874ebead
  passport.deserializeUser((user, done) => {
    // User.findByPk(id).then((user) => {
    //   if (user) {
    //     done(null, user.get())
    //   } else {
    //     done(user.errors, null)
    //   }
    // })
    done(null, user)
  })

  passport.use('local-signup', new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
      // Allow us to pass back the entire request to the callback
      passReqToCallback: true
    }, (req, email, password, done) => {

      let passwordHash = (password) => {
        return bcrypt.hashSync(password, bcrypt.genSaltSync(10))
      }

      User.findOne({
        where: {
          email: email
        }
      }).then((user) => {

        if (user) {
          return done(null, false, {
            message: 'The email is already taken'
          })
        } else {
          let userPassword = passwordHash(password)

          data = {
            email: email,
            password: userPassword,
            first_name: req.body.first_name,
            last_name: req.body.last_name
          }

          User.create(data).then((newUser, created) => {
            if (!newUser) {
              return done(null, false)
            } else {
              return done(null, newUser)
            }
          })
        }
      })
    }
  ))

  passport.use('local-signin', new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
      // Allow us to pass back the entire request to the callback
      passReqToCallback: true
    }, (req, email, password, done) => {

      let isValidPassword = (userPassword, password) => {
        console.log('Compare Password: ' + userPassword + '==' + password)
        console.log(bcrypt.compareSync(password, userPassword))
        console.log(bcrypt.hashSync(password, bcrypt.genSaltSync(10)))
        return bcrypt.compareSync(password, userPassword)
      }

      User.findOne({
        where: {
          email: email
        }
      }).then((user) => {
        if (!user) {
          return done(null, false, {
            message: 'The email does not exist'
          })
        }

        if (!isValidPassword(user.password, password)) {
          return done(null, false, {
            mesage: 'Incorrect password'
          })
        }

        let userInfo = user.get()
        return done(null, userInfo)
      }).catch((err) => {
        console.log("Error: " + err)
        return done(null, false, {
          message: 'Something went wrong'
        })
      })
    }
  ))

  passport.use('ldap-auth', new LdapStrategy({
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
  }, (req, user, done) => {

    if (!user.display_name) {
      User.findOrCreate({
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
}
