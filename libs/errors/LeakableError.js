function LeakableBotError(message) {
  this.name = 'LeakableBotError';
  this.message = message.toLowerCase();
}

LeakableBotError.prototype = Error.prototype;

module.exports = LeakableBotError;
