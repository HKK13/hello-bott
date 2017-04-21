let EventEmitter = require('events').EventEmitter;


class Bot extends EventEmitter {
  constructor() {
    super();
    this.rtm = {};
    this.rtm.sendMessage = (message, channel) => {
      return this.emit('testReturn', {message: message, channel: channel});
    };

    this.id = 'TASKMAN';
    this.owner = {
      name: 'testuser',
      id: 'TESTUSR',
      real_name: 'test user',
      email: 'test@test.test',
      is_admin: true,
      is_owner: true
    };


    this.list = {
      TESTUSR: {
        user: {
          name: 'testuser',
          id: 'TESTUSR',
          real_name: 'test user',
          profile: {
            email: 'test@test.test'
          },
          is_admin: true,
          is_owner: true
        }
      },
      NAMELESS: {
        user: {
          name: 'testuser2',
          id: 'NAMELESS',
          real_name: '',
          profile: {
            email: 'test@test.test'
          },
          is_admin: true,
          is_owner: true
        }
      },
      FRAUDUSR: {
        user: {
          name: 'testuser3',
          id: 'FRAUDUSR',
          real_name: 'test user',
          profile: {
            email: 'test@test.test'
          },
          is_admin: false,
          is_owner: false
        }
      }
    };

    this.web = {};
    this.web.users = {
      info: (id) => {
        console.log(this.list[id]);
        return this.list[id];
      }
    }
  }
}

module.exports = new Bot();
