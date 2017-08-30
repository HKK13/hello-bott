'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const expect = chai.expect;
const sinon = require('sinon');
const LeakableBotError = require('../libs/errors/LeakableError');

const mongoose = require('mongoose');
const Promise = require('bluebird');
mongoose.Promise = Promise;

let Workday = require('../models/Workday');
let Message = require('../libs/Message');
let ModuleCore = require('../libs/ModuleCore');


let params = { type: 'message',
  channel: 'C4GPU1BGE',
  user: 'U4GQ53YG7',
  text: 'start someproj',
  ts: '1504081398.000040',
  source_team: 'T4G1T27GB',
  team: 'T4G1T27GB' };


describe('# Workday Schema', () => {
  describe('- validate', () => {
    it('should not validate without a slack id.', (done) => {
      let params = {
        intervals: [{description: 'test'}]
      };

      let workday = new Workday(params);
      workday.validate((err) => {
        expect(err).to.be.an.instanceof(Error);
        done();
      });
    });

    it('should validate required fields.', (done) => {
      let params = {
        slackId: 'SOMEUSER'
      };

      let workday = new Workday(params);
      workday.validate().then(() => done())
    });
  });

  describe('- endDay', () => {
    it('should end the day if it is still ongoing.', () => {

      let now = Date.now();
      let workday = new Workday({
        slackId: 'SOMEUSER',
        begin: now,
        intervals: [{begin: now, description: 'test'}]
      });

      sinon.stub(Workday.prototype, 'save').callsFake(function () {
        expect((new Date(this.begin)).getTime()).to.be.equal(now);
        expect((new Date(this.begin)).getTime()).to.be.equal(now);
        expect(this.intervals[0].end).to.be.an.instanceOf(Date);

        workday.save.restore();
      });

      return workday.endDay();

    });

    it('should end the day with last break\'s time if the ' +
      'workday is ended while in break.', () => {

      let now = Date.now();
      let workday = new Workday({
        slackId: 'SOMEUSER',
        begin: now,
        intervals: [{begin: now, description: 'test', end: now+1000}]
      });

      sinon.stub(Workday.prototype, 'save').callsFake(function () {
        expect((new Date(this.begin)).getTime()).to.be.equal(now);
        expect((new Date(this.begin)).getTime()).to.be.equal(now);
        expect(this.intervals[0].end).to.be.an.instanceOf(Date);
        expect((new Date(this.end)).getTime()).to.be.equal(now+1000);
        expect((new Date(this.end)).getTime()).to.be
          .equal((new Date(this.intervals[0].end)).getTime());

        workday.save.restore();
      });

      return workday.endDay();
    });

    it('should throw an error if there is no active workday.', async () => {
      let now = Date.now();
      let workday = new Workday({
        slackId: 'SOMEUSER',
        begin: now,
        intervals: [{begin: now, description: 'test', end: now+10000}],
        end: now+10000
      });

      return expect(workday.endDay()).to.be.rejectedWith(LeakableBotError());
    });
  });

  describe('- continueDay', () => {
    it('should continue if the last interval is ended and current day is still ongoing.', () => {

      let now = Date.now();
      let workday = new Workday({
        slackId: 'SOMEUSER',
        begin: now,
        intervals: [{begin: now, description: 'test', end: now+1000}]
      });

      sinon.stub(Workday.prototype, 'save').callsFake(function () {
        let obj = this;
        expect(obj).to.have.a.property('begin').that.is.an.instanceof(Date);
        expect(obj.end).to.be.undefined;
        expect(obj.intervals).to.have.lengthOf(2);
        expect(obj.intervals[1]).to.have.property('begin').that.is.an.instanceof(Date);
        expect(obj.intervals[1].end).to.be.undefined;
        workday.save.restore();
      });

      return workday.continueDay();

    });

    it('should continue if the last interval and the current day is ended.', () => {

      let now = Date.now();
      let workday = new Workday({
        slackId: 'SOMEUSER',
        begin: now,
        intervals: [{begin: now, description: 'test', end: now+1000}],
        end: now+1000
      });

      sinon.stub(Workday.prototype, 'save').callsFake(function () {
        let obj = this;
        expect(obj).to.have.a.property('begin').that.is.an.instanceof(Date);
        expect(obj.end).to.be.equal(null);
        expect(obj.intervals).to.have.lengthOf(2);
        expect(obj.intervals[1]).to.have.property('begin').that.is.an.instanceof(Date);
        expect(obj.intervals[1].end).to.be.undefined;
        workday.save.restore();
      });

      return workday.continueDay('Hebele');

    });

    it('should not continue if the last interval is not ended.', () => {

      let now = Date.now();
      let workday = new Workday({
        slackId: 'SOMEUSER',
        begin: now,
        intervals: [{begin: now, description: 'test'}]
      });

      return expect(workday.continueDay()).to.be.rejectedWith(LeakableBotError());
    });
  });

  describe('- giveBreak', () => {
    it('should give a break if there is an interval still in progress.', (done) => {
      let now = Date.now();
      let workday = new Workday({
        slackId: 'SOMEUSER',
        begin: now,
        intervals: [{begin: now, description: 'test'}]
      });

      sinon.stub(Workday.prototype, 'save').callsFake(function () {
        let obj = this;
        expect(obj).to.have.a.property('begin').that.is.an.instanceof(Date);
        expect(obj.end).to.be.undefined;
        expect(obj.intervals).to.have.lengthOf(1);
        expect(obj.intervals[0]).to.have.property('begin').that.is.an.instanceof(Date);
        expect(obj.intervals[0]).to.have.property('end').that.is.an.instanceof(Date);
        workday.save.restore();
        done();
      });

      workday.giveBreak();
    });

    it('should not give a break if the day is already over.', () => {

      let now = Date.now();
      let workday = new Workday({
        slackId: 'SOMEUSER',
        begin: now,
        intervals: [{begin: now, description: 'test', end: now+1000}],
        end: now+1000
      });

      return expect(workday.giveBreak()).to.be.rejectedWith(LeakableBotError());
    });

    it('should not give a break if already in a break.', () => {

      let now = Date.now();
      let workday = new Workday({
        slackId: 'SOMEUSER',
        begin: now,
        intervals: [{begin: now, description: 'test', end: now+1000}]
      });

      return expect(workday.giveBreak()).to.be.rejectedWith(LeakableBotError());
    });
  });

  describe('- getLastWorkdayByUser', () => {
    it('should call model.findOne with slack id and get the last item.', (done) => {
      sinon.stub(Workday, 'findOne').callsFake(function () {
        this.sort = (sort) => {
          expect(sort).to.eql({ createdAt: -1 });
        };
        return this;
      });

      Workday.getLastWorkdayByUser('SOMEUSER');

      sinon.assert.calledWith(Workday.findOne, {slackId: 'SOMEUSER'});
      Workday.findOne.restore();
      done();
    })
  });
});

describe('# Message Class', () => {
  describe('- constructor', () => {
    it('should construct message object with slack response.', () => {
      let message = new Message(params);

      expect(message.messageObject).to.eql(params);
      expect(message.text).to.be.equal(params.text);
      expect(message.user).to.be.equal(params.user);
    });
  });

  describe('- send', () => {
    it('should throw an error if send method is not provided.', () => {
      let message = new Message(params);

      expect(message.send).to.throw(Error);
    });
  });

  describe('- reply', () => {
    it('should reply to the sender\'s channel', () => {
      let message = new Message(params);
      let textMessage = 'SOMETESTMESSAGE.';
      sinon.stub(message, 'send').callsFake((text, channel) => {
        expect(text).to.be.equal(textMessage);
        expect(channel).to.be.equal(params.channel);
        message.send.restore();
      });

      message.reply(textMessage);
    });
  });

  describe('- extractCommand', () => {
    let message = new Message(params);
    let {command, text} = message.extractCommand();
    let testCommand = params.text.split(' ')[0];
    let testText = params.text.split(' ')[1];

    expect(command).to.be.equal('_' + testCommand);
    expect(text).to.be.equal(testText);
    expect(message.text).to.be.equal(text);
    expect(message.command).to.be.equal(command);
  });

  describe('- throw', () => {
    it('should send no command error message to user.', () => {
      let message = new Message(params);
      let {command, text} = message.extractCommand();
      command = command.split('_')[1];
      sinon.stub(message, 'send').callsFake((text, channel) => {
        expect(text).to.be.equal(`<@${message.user}>, command '${command}' does not exist.`);
        expect(channel).to.be.equal(message.messageObject.channel);
        message.send.restore();
      });

      message.throw(new TypeError('has no function.'));
    });

    it('should send leakable bot error messsage to the user.', () => {
      let message = new Message(params);
      let {command, text} = message.extractCommand();
      let errorMessage = 'SOMEVERBOSETESTERRORMESSAGE';
      command = command.split('_')[1];
      sinon.stub(message, 'send').callsFake((text, channel) => {
        expect(text).to.be.equal(`<@${message.user}>, ${errorMessage.toLowerCase()}`);
        expect(channel).to.be.equal(message.messageObject.channel);
        message.send.restore();
      });

      message.throw(new LeakableBotError(errorMessage));
    });

    it('should send generic error messsage to the user.', () => {
      let message = new Message(params);
      let {command, text} = message.extractCommand();
      command = command.split('_')[1];

      sinon.stub(message, 'send').callsFake((text, channel) => {
        expect(text).to.be.equal(`Problems captain!`);
        expect(channel).to.be.equal(message.messageObject.channel);
        message.send.restore();
      });

      message.throw(new Error('SOMEMESSAGE'));
    });
  });
});

describe('# ModuleCore Class', () => {
  describe('- parseCommand', () => {
    it('should parse command by extracting command from text', () => {
      let message = new Message(params);
      let module = new ModuleCore();

      sinon.stub(module, 'parseCommand');
      module.parseCommand(message);
      sinon.assert.calledWith(module.parseCommand, message);
      module.parseCommand.restore();
    });
  });

  describe('- decideDispatch', () => {
    it('should decide dispatch path.', () => {
      let message = new Message(params);
      let {command, text} = message.extractCommand();

      ModuleCore.prototype._testFunction = (text, mess) => {
        expect(text).to.be.equal(message.text);
        expect(mess).to.be.eql(message);
      };

      let module = new ModuleCore();
      module.decideDispatch('_testFunction', text, message);
      ModuleCore.prototype._testFunction = undefined;
    });

    it('should throw TypeError if dispatch is not possible.', () => {
      let message = new Message(params);
      let {command, text} = message.extractCommand();
      let module = new ModuleCore();
      expect(module.decideDispatch('_someNonExistingFunction', text, message)).to.be.rejectedWith(TypeError);
    });
  });

  describe('- dispatchCommand', () => {
    it('should handle call order by calling parseCommand then decideDispatch.', () => {
      let message = new Message(params);
      message.messageObject.text = 'testfunction someproj';

      ModuleCore.prototype._testfunction = (text, mess) => {
        expect(text).to.be.equal(message.text);
        expect(mess).to.be.eql(message);
      };

      let module = new ModuleCore();
      module.dispatchCommand(message);
      ModuleCore.prototype._testfunction = undefined;
    });

    it('should send an error message if command does not exist.', () => {
      let message = new Message(params);
      let module = new ModuleCore();

      sinon.stub(message, 'throw').callsFake((err) => {
        expect(err).to.be.an.instanceof(TypeError);
      });
      module.dispatchCommand(message);
    });
  });

});
