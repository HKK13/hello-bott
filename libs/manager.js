'use strict';

const _ = require('lodash');
const config = require('config');
const debug = require('debug')('manager');
const Workday = require('../models/workday');
const EventEmitter = require('events');
const LeakableBotError = require('./errors/leakableError');
const Bot = require('./libs/bot');


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
      // Get first word as command, pass whole if single word.
      let command = '_' + (message.text.substr(0, message.text.indexOf(' ')) || message.text)
          .toLowerCase();
      let text = '';

      // Remove command before dispatching remaining text.
      if (message.text.indexOf(' ') != -1) {
        text = message.text.substr(message.text.indexOf(' ') + 1);
      }

      debug(`Received '${command}', is user owner: ${Bot.owner.id == message.user}.`);

      // Look if command exists in plugged in modules.
      if (this.commands[command]) {
        message.text = text;
        debug(`Redirecting message to ${command}`);
        debug(`List of comands are %o`, this.commands);
        return this.commands[command].dispatchCommand(message, message.user);
      }


      // TODO: Think more on this. Seems a possible info leak/remote exec(DUH..).
      // Can someone also reach class properties from this?
      // We don't want eternal conditional statements but also
      // don't want anyone to receive bot token for example.
      debug(`Dispatching command '${command}' for ${message.user}`);
      this[command](text , message.user, message.channel);
    } catch (err) {
      debug(`'${message.text}' is failed to be dispatched.`, err);
      let errorMessage = err.name == 'LeakableBotError' ? err.message : 'problems captain!';
      this.send(`<@${message.user}>, ${errorMessage}`, message.channel);
    }
  }


  /**
   * Starts the workday of the user.
   * @param {String} text
   * @param {String} slackId
   * @param {String} channel
   * @private
   */
  async _start(text, slackId, channel) {
    try {
      // We don't want to start a multiple workdays for the sameday.
      // Will throw error if not ended.
      // However user still is able to start a workday in same day,
      // Problematic? Don't think so because evaluation will still be based
      // on times worked.
      await Workday.isLastDayEnded(slackId);

      let now = new Date();
      let newWorkday = new Workday({
        slackId: slackId,
        begin: now,
        intervals: [{begin: now, description: text}]
      });

      let workday = await newWorkday.save();
      this.send(`<@${slackId}>'s workday is just started with ${text}.`, channel);
    } catch (err) {
      console.log(err);
      debug(`Error while starting ${slackId}'s day.`, err);
      let errorMessage = err.name == 'LeakableBotError' ? err.message : 'problems captain!';
      this.send(`<@${slackId}>, ${errorMessage}`, channel);
    }
  }


  /**
   * Gives a break on last workday interval.
   * @param {String} text
   * @param {String} slackId
   * @param {String} channel
   * @private
   */
  async _break(text, slackId, channel) {
    try {
      let lastWorkday = await Workday.getLastWorkdayByUser(slackId);
      await lastWorkday.giveBreak();
      this.send(`<@${slackId}> is giving a break. (${text})`, channel);
    } catch(err) {
      debug(`Error while ${slackId} is trying to give a break`, err);
      let errorMessage = err.name == 'LeakableBotError' ? err.message : 'problems captain!';
      this.send(`<@${slackId}>, ${errorMessage}`, channel);
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
  async _continue(text, slackId, channel) {
    try {
      let lastWorkday = await Workday.getLastWorkdayByUser(slackId);
      await lastWorkday.continueDay(text);
      this.send(`<@${slackId}>'s workday continues with ${text}.`, channel);
    } catch(err) {
      debug(`Error while ${slackId} is trying to continue work`, err);
      let errorMessage = err.name == 'LeakableBotError' ? err.message : 'problems captain!';
      this.send(`<@${slackId}>, ${errorMessage}`, channel);
    }
  }


  /**
   * Ends the workday of the user.
   * @param {String} text
   * @param {String} slackId
   * @param {String} channel
   * @private
   */
  async _end(text, slackId, channel) {
    try {
      let lastWorkday = await Workday.getLastWorkdayByUser(slackId);
      await lastWorkday.endDay();
      this.send(`End of the workday for <@${slackId}>.`, channel);
    } catch(err) {
      debug(`Error while ${slackId} is trying end the workday.`, err);
      let errorMessage = err.name == 'LeakableBotError' ? err.message : 'problems captain!';
      this.send(`<@${slackId}>, ${errorMessage}`, channel);
    }
  }


  /**
   * Say something to channel.
   * @param {String} message
   * @param {String} channel
   */
  send(message, channel) {
    Bot.rtm.sendMessage(message, Bot.channels[channel] || channel);
  }
}

module.exports = Manager;
