function LeakableBotError(message) {
  this.name = 'LeakableBotError';
  if (message)
    this.message = message.toLowerCase();
}

LeakableBotError.prototype = Error.prototype;

module.exports = LeakableBotError;
