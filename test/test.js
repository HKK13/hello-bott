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

    it('should validate required fields', (done) => {
      let params = {
        slackId: 'SOMEUSER'
      };

      let workday = new Workday(params);
      workday.validate().then(() => done())
    });
  });

  describe('- endDay', () => {
    it('should end the day if it is still ongoing', () => {

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

    it('should throw an error if there is no active workday', async () => {
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
    it('should call model.findOne with slack id and get the last item', (done) => {
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
