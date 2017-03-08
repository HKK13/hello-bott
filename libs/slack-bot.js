"use strict";

const SlackCore = require('sourcebot').Slack;
const SlackBot = new SlackCore({
  token: 'xoxb-17065016470-0O9T0P9zSuMVEG8yM6QTGAIB'
});

class ActiveBot {

  constructor () {
    if (!this.bot)
      this.bot = await (SlackBot.connect());

    return this.bot;
  }
}

module.exports = ActiveBot();
