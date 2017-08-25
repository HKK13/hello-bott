'use strict';

const _ = require('lodash');
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
   * @param {Object} message
   */
  async dispatchCommand(message) {
    let {command, text} = this.parseCommand(message);

    try {
      debug(`Dispatching command '${command}' for ${message.user}`);

      await this.decideDispatch(command, text, message);
    } catch (err) {
      debug(`'${message.text}' is failed to be dispatched.`, err);
      message.throw(err);
    }
  }


  parseCommand(message) {
    return message.extractCommand();
  }


  /**
   * Command dispatch logic. Decides where should that command go.
   * @param {String} command
   * @param {String} text
   * @param {Object} message
   * @returns {*}
   */
  async decideDispatch (command, text, message) {
    return await this[command](text , message)
  }

}

module.exports = ModuleCore;
