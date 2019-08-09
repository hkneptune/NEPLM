const bcrypt = require('bcryptjs')
const PassportStrategy = require('passport-local')

module.exports = (passport, user) => {

  let User = user
  let LocalStrategy = PassportStrategy.Strategy

  passport.serializeUser((user, done) => {
    done(null, user.id)
  })

  passport.deserializeUser((id, done) => {
    User.findByPk(id).then((user) => {
      if (user) {
        done(null, user.get())
      } else {
        done(user.errors, null)
      }
    })
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
}
