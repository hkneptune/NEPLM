module.exports = (sequelize, Sequelize) => {

  let LdapUsers = sequelize.define('ldap_users', {

    id: {
      autoIncrement: false,
      primaryKey: true,
      type: Sequelize.STRING(32),
      allowNull: false,
      notEmpty: true,
      unique: true,
      validate: {
        len: {
          args: [1, 32],
          msg: 'The CORP ID is not valid in length'
        }
      }
    },
    uuid: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      allowNull: false,
      notEmpty: true,
      unique: true
    },
    display_name: {
      type: Sequelize.STRING(32),
      notEmpty: true,
      validate: {
        len: {
          args: [1, 32],
          msg: 'The Display Name is not valid in length'
        }
      }
    },
    first_name: {
      type: Sequelize.STRING(32),
      notEmpty: true,
      validate: {
        len: {
          args: [1, 32],
          msg: 'The First Name is not valid in length'
        }
      }
    },
    last_name: {
      type: Sequelize.STRING(32),
      notEmpty: true,
      validate: {
        len: {
          args: [1, 32],
          msg: 'The Last Name is not valid in length'
        }
      }
    },
    title: {
      type: Sequelize.STRING(64),
      notEmpty: true,
      validate: {
        len: {
          args: [1, 64],
          msg: 'The Title is not valid in length'
        }
      }
    },
    email: {
      type: Sequelize.STRING(128),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        len: {
          args: [6, 128],
          msg: 'The Email Address is not valid in length'
        }
      }
    },
    email_aliases: {
      type: Sequelize.STRING(512),
      allowNull: true,
      validate: {
        len: {
          args: [0, 512],
          msg: 'The Email Aliases is not valid in length'
        }
      }
    },
    department: {
      type: Sequelize.STRING(32),
      notEmpty: true,
      validate: {
        len: {
          args: [1, 32],
          msg: 'The Department is not valid in length'
        }
      }
    },
    company: {
      type: Sequelize.STRING(32),
      notEmpty: true,
      validate: {
        len: {
          args: [1, 32],
          msg: 'The Company is not valid in length'
        }
      }
    },
    joined: {
      type: Sequelize.STRING(14),
      notEmpty: true,
      validate: {
        len: {
          args: [14, 14],
          msg: 'The Joined Date is not valid in length'
        }
      }
    },
    last_login: {
      type: Sequelize.DATE(6)
    },
    active: {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    }
  })

  return LdapUsers
}
