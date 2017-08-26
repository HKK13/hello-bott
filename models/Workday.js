const mongoose = require('mongoose');
const LeakableBotError = require('../libs/errors/LeakableError');

let Workday = mongoose.Schema({
  begin: {type: Date, default: Date.now},
  intervals: [
    {
      _id: false,
      begin: {type: Date, default: Date.now},
      end: {type: Date},
      description: {type: String}
    }
  ],
  end: {type: Date},
  slackId: {type: String, required: true, index: true},
  createdAt: {type: Date, default: Date.now}
});


Workday.statics.getLastWorkdayByUser = function (id) {
  return this.findOne({slackId: id}).sort({createdAt: -1});
};


Workday.methods.endDay = function () {
  if(!this.begin)
    throw new LeakableBotError('Cannot end what you didn\'t start');

  if(this.end)
    throw new LeakableBotError('Already called it a day.');

  let lastInterval = this.intervals.length-1;
  if(this.intervals[lastInterval].end) { // If finishing after a break.
    this.end = this.intervals[lastInterval].end; //Assign end as last break.
  } else {
    let now = new Date();
    this.intervals[lastInterval].end = now;
    this.end = now;
  }

  return this.save();
};


Workday.methods.giveBreak = function () {
  if(!this.begin)
    throw new LeakableBotError('Cannot break if not started.');

  if(this.end)
    throw new LeakableBotError('You cannot break that which is already ended.');

  let lastInterval = this.intervals.length-1;
  if(this.intervals[lastInterval].end)
    throw new LeakableBotError('You cannot give a break if you are already in a break.');

  this.intervals[lastInterval].end = new Date();
  return this.save();
};


Workday.methods.continueDay = function (description) {
  if(!this.begin)
    throw new LeakableBotError('Cannot continue if not started.');

  if(this.end)
    this.end = null;

  let lastInterval = this.intervals.length-1;
  if(!this.intervals[lastInterval].end)
    throw new LeakableBotError('Cannot continue if no break is given.');

  this.intervals.push({begin: new Date(), description: description});
  return this.save();
};


module.exports = mongoose.model('Workday', Workday);
