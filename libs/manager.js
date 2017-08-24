'use strict';

const _ = require('lodash');
const config = require('config');
const debug = require('debug')('manager');
const Workday = require('../models/workday');
const LeakableBotError = require('./errors/leakableError');
const Bot = require('./bot');
const helpers = require('./Helpers');


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
  }


  /**
   * Calls the corresponding command's function.
   * @param {String} message
   * @private
   */
  async dispatchCommand(message) {
    try {
      let {command, text} = helpers.extractCommand(message);
      debug(`Received '${command}', is user owner: ${Bot.owner.id == message.user}.`);

      // Look if command exists in plugged in modules.
      if (this.commands.has(command)) {
        message.text = text;
        debug(`Redirecting message to ${command}`);
        debug(`List of comands are %o`, this.commands);
        return this.commands[command](message, message.user);
      }

      debug(`Dispatching command '${command}' for ${message.user}`);
      this[command](text, message);
    } catch (err) {
      debug(`'${message.text}' is failed to be dispatched.`, err);
      let errorMessage = err.name == 'LeakableBotError' ? err.message : 'problems captain!';
      message.reply(`<@${message.user}>, ${errorMessage}`, message.channel);
    }
  }


  /**
   * Starts the workday of the user.
   * @param {String} text
   * @param {Object} message
   * @private
   */
  async _start(text, message) {
    try {
      // We don't want to start a multiple workdays for the sameday.
      // Will throw error if not ended.
      // However user still is able to start a workday if the previous one is ended
      // in same day,
      // Problematic? Don't think so because evaluation will still be based
      // on times worked.
      await Workday.isLastDayEnded(message.user);

      let now = new Date();
      let newWorkday = new Workday({
        slackId: message.user,
        begin: now,
        intervals: [{begin: now, description: text}]
      });

      let workday = await newWorkday.save();
      message.reply(`<@${message.user}>'s workday is just started with ${text}.`, message.channel);
    } catch (err) {
      debug(`Error while starting ${message.user}'s day.`, err);
      let errorMessage = err.name == 'LeakableBotError' ? err.message : 'problems captain!';
      message.reply(`<@${message.user}>, ${errorMessage}`, message.channel);
    }
  }


  /**
   * Gives a break on last workday interval.
   * @param {String} text
   * @param {String} slackId
   * @param {String} channel
   * @private
   */
  async _break(text, message) {
    try {
      let lastWorkday = await Workday.getLastWorkdayByUser(message.user);
      await lastWorkday.giveBreak();
      message.reply(`<@${message.user}> is giving a break. (${text})`, message.channel);
    } catch(err) {
      debug(`Error while ${message.user} is trying to give a break`, err);
      let errorMessage = err.name == 'LeakableBotError' ? err.message : 'problems captain!';
      message.reply(`<@${message.user}>, ${errorMessage}`, message.channel);
    }
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
    try {
      let lastWorkday = await Workday.getLastWorkdayByUser(message.user);
      await lastWorkday.continueDay(text);
      message.reply(`<@${message.user}>'s workday continues with ${text}.`, message.channel);
    } catch(err) {
      debug(`Error while ${message.user} is trying to continue work`, err);
      let errorMessage = err.name == 'LeakableBotError' ? err.message : 'problems captain!';
      message.reply(`<@${message.user}>, ${errorMessage}`, message.channel);
    }
  }


  /**
   * Ends the workday of the user.
   * @param {String} text
   * @param {String} slackId
   * @param {String} channel
   * @private
   */
  async _end(text, message) {
    try {
      let lastWorkday = await Workday.getLastWorkdayByUser(message.user);
      await lastWorkday.endDay();
      message.reply(`End of the workday for <@${message.user}>.`, message.channel);
    } catch(err) {
      debug(`Error while ${message.user} is trying end the workday.`, err);
      let errorMessage = err.name == 'LeakableBotError' ? err.message : 'problems captain!';
      message.reply(`<@${message.user}>, ${errorMessage}`, message.channel);
    }
  }
}

module.exports = new Manager();
