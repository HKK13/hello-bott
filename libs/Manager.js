'use strict';

const _ = require('lodash');
const config = require('config');
const debug = require('debug')('manager');
const Workday = require('../models/Workday');
const Bot = require('./Bot');


class Manager{
  constructor() {
    this.commands = new Map(); // Maybe use Set?
    this.dispatchCommand = this.dispatchCommand.bind(this);
    Bot.on('message', this.dispatchCommand);
    debug('Manager created.');
  }


  /**
   * Registers command name and call the corresponding command.
   * @param event
   */
  registerCommand(command, dispatchMethod) {
    this.commands.set('_' + command, dispatchMethod);
    debug(`Registered ${command} into commands.`);
  }


  /**
   * Calls the corresponding command's function.
   * @param {String} message
   * @private
   */
  async dispatchCommand(message) {
    try {
      let {command, text} = message.extractCommand();
      debug(`Received '${command}', is user owner: ${Bot.owner.id == message.user}.`);

      // Look if command exists in plugged in modules.
      if (this.commands.has(command)) {
        message.text = text;
        debug(`Redirecting message to ${command}`);
        debug(`List of comands are %o`, this.commands.keys());
        return this.commands.get(command)(message);
      }

      debug(`Dispatching command '${command}' for ${message.user}`);
      await this[command](text, message);
    } catch (err) {
      debug(`'${message.text}' is failed to be dispatched.`, err);
      message.throw(err);
    }
  }


  /**
   * Starts the workday of the user.
   * @param {String} text
   * @param {Object} message
   * @private
   */
  async _start(text, message) {
    await Workday.isLastDayEnded(message.user);

    let now = new Date();
    let newWorkday = new Workday({
      slackId: message.user,
      begin: now,
      intervals: [{begin: now, description: text}]
    });

    let workday = await newWorkday.save();
    message.reply(`<@${message.user}>'s workday is just started with ${text}.`);
  }


  /**
   * Gives a break on last workday interval.
   * @param {String} text
   * @param {String} slackId
   * @param {String} channel
   * @private
   */
  async _break(text, message) {
    let lastWorkday = await Workday.getLastWorkdayByUser(message.user);
    await lastWorkday.giveBreak();
    message.reply(`<@${message.user}> is giving a break. (${text})`);
  }


  /**
   * Continues after break or ended day by overriding the 'end' field of
   * the workday.
   * @param {String} text
   * @param {String} slackId
   * @param {String} channel
   * @private
   */
  async _continue(text, message) {
    let lastWorkday = await Workday.getLastWorkdayByUser(message.user);
    await lastWorkday.continueDay(text);
    message.reply(`<@${message.user}>'s workday continues with ${text}.`);
  }


  /**
   * Ends the workday of the user.
   * @param {String} text
   * @param {String} slackId
   * @param {String} channel
   * @private
   */
  async _end(text, message) {
    let lastWorkday = await Workday.getLastWorkdayByUser(message.user);
    await lastWorkday.endDay();
    message.reply(`End of the workday for <@${message.user}>.`, message);
  }
}

module.exports = new Manager();
