let chai = require('chai');
let Promise = require('bluebird');

let mongoose = require('mongoose');

mongoose.Promise = Promise;
let assert = chai.assert;

let User = require('../models/user');
let Workday = require('../models/workday');

let Manager = require('../libs/manager');
let UserModule = require('../libs/commands/user');
let TestModule = require('./modules/module');
let Bot = require('./mock/bot');

/**
 * I SUCK AT TESTING!
 */

describe('User', () => {

  it('should connect to test database', () => {
    return mongoose.connect('mongodb://localhost:/taskman-test');
  });

});


describe('Workday', () => {
  it('should start a workday', async () => {
    try {
      let now = new Date();

      let workday = new Workday({
        slackId: 'TESTUSR',
        begin: now,
        intervals: [{begin: now, description: ''}],
      });

      let dbWorkday = await workday.save();

      assert.isNotNull(dbWorkday.begin);
      assert.lengthOf(dbWorkday.intervals, 1);
      assert.isNotNull(dbWorkday.intervals[0].begin);
      assert.isUndefined(dbWorkday.intervals[0].end);
      assert.isUndefined(dbWorkday.end);
      assert.isDefined(dbWorkday.createdAt);

      return Promise.resolve();
    } catch (err) {
      console.error(err);
      return Promise.reject(err);
    }
  });


  it('should determine that the last workday is not finished.', async () => {
    try {
      let result = await Workday.isLastDayEnded('TESTUSR');

      assert.isTrue(result);
      return Promise.resolve();
    } catch (err) {
      if(err.name == 'LeakableBotError') return Promise.resolve();

      console.error(err);
      return Promise.reject(err);
    }
  });
});


describe('Manager', () => {
  let bot = Bot;
  let manager = null;


  it('should construct manager with the bot and modules.', (done) => {
    manager = new Manager(bot, {
      'user': new UserModule(bot),
      'test': new TestModule(bot)
    });

    assert.lengthOf(Object.keys(manager.commands), 2);
    assert.typeOf(manager.bot, 'Object');
    assert.typeOf(manager.bot.rtm, 'Object');
    assert.typeOf(manager.bot.web, 'Object');
    assert.typeOf(manager.bot.owner, 'Object');
    assert.equal(manager.bot.owner.id, 'TESTUSR');
    assert.equal(manager.bot.id, 'TASKMAN');

    done();
  });

  it('should listen for incoming messages from bot.', function (done) {
    manager.listen();
    manager.bot.on('testReturn', (res) => {
      done();
    });
    manager.bot.emit('message', {user: 'TESTUSR', text: '<@TASKMAN> test test', channel: 'CHANNEL'});
  });
});

describe('Cleanup', () => {
  it('should wipe test database', () => {
    return mongoose.connection.db.dropDatabase();
  });
});

