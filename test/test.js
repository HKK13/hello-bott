'use strict';

let chai = require('chai');
let expect = chai.expect;
let sinon = require('sinon');

const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

let Workday = require('../models/Workday');


describe('# Workday Schema', () => {
  describe('- validate', () => {
    it('should not validate without a username.', (done) => {
      let params = {
        intervals: [{description: 'test'}]
      };

      let workday = new Workday(params);
      workday.validate((err) => {
        expect(err).to.be.an.instanceof(Error);
        done();
      });
    });
  });

  describe('- endDay', () => {
    it('should end the day if it is still ongoing', (done) => {

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
        done();
      });

      workday.endDay();

    });
  });

  describe('- continueDay', (done) => {
    it('should continue if the last interval is ended and current day is still ongoing.', (done) => {

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
        done();
      });

      workday.continueDay('Hebele');

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
    })
  });

});
