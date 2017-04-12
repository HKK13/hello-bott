'use strict';

const bot = require('./bot');
const tracer = require('./tracer');
const debug = require('debug')('manager');

class Manager {
  constructor() {
    this.bot = bot;
    this.listen();
    debug('Manager created.');
  }

  listen() {
    this.bot.on('message', (message) => {
      debug('Message: %o', message);
      if (message.text.indexOf(`<@${this.bot.id}>`) == -1) return;
      let messageText = (message.text.split('>')[1]).trim();
      debug(message);

      //TODO: Will be filled with too much if else find a solution.
      if (messageText.indexOf('start') === 0) {
        debug(messageText.split(' ')[1]);
        if(tracer.start(message.user, messageText.split(' ')[1])) {
          this.bot.rtm.sendMessage(`<@${message.user}> started the day.`, message.channel);
        }
        debug('Tracer started %o', tracer.dummy);
      } else {
        this.bot.rtm.sendMessage(`<@${message.user}>, no such command bruh.`, message.channel);
      }
    });
  }


  send(message, channel) {
    this.bot.rtm.sendMessage(message, this.bot.channels[channel]);
  }

}

module.exports = new Manager();
