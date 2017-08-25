'use strict';

const _ = require('lodash');
const LeakableBotError = require('./errors/LeakableError');
const helpers = require('./Helpers');
const debug = require('debug');


class ModuleCore {

  constructor() {
    debug('Command module constructed.');
    this.dispatchCommand = this.dispatchCommand.bind(this);
  }

  /**
   * Calls the corresponding command's or module's command function.
   * Throws and responds with an error when no corresponding command exists.
   *
   * @param {String} message
   */
  async dispatchCommand(message) {
    let {command, text} = this.parseCommand(message);

    try {
      debug(`Dispatching command '${command}' for ${message.user}`);

      await this.decideDispatch(command, text, message);
    } catch (err) {
      debug(`'${message.text}' is failed to be dispatched.`, err);
      message.reply(err, message);
    }
  }

  /**
   * Extracts the command from the message text and returns them.
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
  async decideDispatch (command, text, message) {
    return await this[command](text , message)
  }

}

module.exports = ModuleCore;
