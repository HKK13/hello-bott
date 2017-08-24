'use strict';

const _ = require('lodash');
const debug = require('debug');
const LeakableBotError = require('./errors/leakableError');
const helpers = require('./Helpers');


class ModuleCore {
  /**
   * Calls the corresponding command's or module's command function.
   * Throws and responds with an error when no corresponding command exists.
   *
   * @param {String} message
   */
  async dispatchCommand(message) {
    try {
      let {command, text} = this.parseCommand();
      debug(`Dispatching command '${command}' for ${message.user}`);

      await this.decideDispatch();
    } catch (err) {
      debug(`'${message.text}' is failed to be dispatched.`, err);
      let errorMessage = err.name == 'LeakableBotError' ? err.message : 'problems captain!';
      this.bot.send(`<@${message.user}>, ${errorMessage}`, message.channel);
    }
  }

  /**
   * Extracts the command from the message and returns them.
   * @param {String} message
   * @returns {command, text}
   */
  parseCommand(message) {
    return helpers.extractCommand(message);
  }

  /**
   * Decides command dispatch.
   * @param command
   * @param message
   * @returns {*}
   */
  async decideDispatch (command, message) {
    return await this[command](text , message.user, message.channel)
  }

}

module.exports = ModuleCore;
