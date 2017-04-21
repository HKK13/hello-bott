'use strict';


class Test {
  constructor(bot) {
    this.bot = bot;
  }

  dispatchCommand(message, user) {
    let command = '_' + (message.text.substr(0, message.text.indexOf(' '))
      || message.text).toLowerCase();


    let text = '';

    //Some functions does not need params
    if (message.text.indexOf(' ') != -1)
      text = message.text.substr(message.text.indexOf(' ') + 1);

    this[command](text, user, message.channel);
  }

  _test(text, user, channel) {
    return this.bot.rtm.sendMessage('hello world');
  }
}

module.exports = Test;
