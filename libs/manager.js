'use strict';

const _ = require('lodash');
const WebClient = require('@slack/client').WebClient;
const bot = require('./bot');
const config = require('config');
const debug = require('debug')('manager');
const Workday = require('../models/workday');
const User = require('../models/user');
const LeakableBotError = require('./errors/leakableError');


class Manager {
  /**
   * @Constructor
   * @param {Object} commandModules
   */
  constructor(commandModules) {
    this.bot = bot;
    this.web = new WebClient(process.env.SLACK_TOKEN || config.get('slackToken'));
    this.commands = {}; // Maybe use Set?
    debug('Manager created.');

    if (commandModules) {
      _.forEach(commandModules, (module, key) => {
        this.commands['_' + key] = module;
        debug(`Add module '${key}'.`);
      });
    }

    this._listen();
  }


  /**
   * @private
   * Listens for mentions or direct messages to the bot.
   */
  _listen() {
    this.bot.on('message', (message) => {
      debug('Message: %o', message);

      let messageText = message.text.trim();

      //Public message, look for mention.
      if (message.channel[0] === 'C' && message.text.indexOf(`<@${this.bot.id}>`) == 0) {
        //Remove mention from message.
        messageText = messageText.substr(messageText.indexOf(' ') + 1);
      } else if (message.channel[0] !== 'D') {
        //If finally is not a direct message.
        return;
      }

      message.text = messageText;
      this.dispatchCommand(message);
    });
    debug('Listening for messages');
  }


  /**
   * Calls the corresponding command's function.
   * @param {String} message
   * @private
   */
  async dispatchCommand(message) {
    let command = '_' + (message.text.substr(0, message.text.indexOf(' ')) || message.text);
    let text = '';
    if (message.text.indexOf(' ') != -1) {
      text = message.text.substr(message.text.indexOf(' ') + 1);
      if (text.split(' ').length >= 2) {
        var secondCommand = text.split(' ')[0];
        if(text.indexOf('<@'))
          var param = text.split(' ')[1].split('@')[1].split('>')[0];
      }
    }


    try {
      let user = await User.findOne({'slack.id': message.user});

      debug(`Received '${command}', is user owner: ${this.bot.owner.id == message.user}, is registered in database:`, user);

      // There should be a better way!
      if (!user && this.bot.owner.id == message.user && command == '_user'
            && secondCommand && param && secondCommand == 'create'
            && param == this.bot.owner.id) {

        user = this.bot.owner;
      } else if(!user) {
        this.send(`<@${message.user}>, you are not registered in taskman database.`, message.channel);
      }

      if (this.commands[command]) {
        message.text = text;
        debug(`Redirecting message to ${command}`);
        return this.commands[command].dispatchCommand(message, user);
      }

      // TODO: Think more on this.
      // Can someone also reach class properties from this?
      debug(`Dispatching command '${command}' for ${message.user}`);
      this[command](text || '', user, message.channel);
    } catch (err) {
      debug(`Command '${command} is failed to be dispatched.'`, err);
      let errorMessage = err.name == 'LeakableBotError' ? err.message : 'problems captain!';
      this.send(`<@${user.slack.id}>, ${errorMessage}`, message.channel);
    }
  }


  /**
   * Starts the workday of the user.
   * @param {String} text
   * @param {Object} user
   * @param {String} channel
   * @private
   */
  async _start(text, user, channel) {
    try {
      // We don't want to start a multiple workdays for the sameday.
      // Will throw error if not ended.
      await Workday.isLastDayEnded(user);

      let now = new Date();
      let newWorkday = new Workday({
        user: user,
        begin: now,
        intervals: [{begin: now, description: text}]
      });

      let workday = await newWorkday.save();
      this.send(`<@${user.slack.id}>'s workday is just started with ${text}.`, channel);
    } catch (err) {
      console.log(err);
      debug(`Error while starting ${user.slack.id}'s day.`, err);
      let errorMessage = err.name == 'LeakableBotError' ? err.message : 'problems captain!';
      this.send(`<@${user.slack.id}>, ${errorMessage}`, channel);
    }
  }


  /**
   * Puts a break between work hours.
   * @param {String} text
   * @param {Object} user
   * @param {String} channel
   * @private
   */
  async _break(text, user, channel) {
    try {
      let lastWorkday = await Workday.getLastWorkdayByUser(user);
      await lastWorkday.giveBreak();
      this.send(`<@${user.slack.id}> is giving a break. (${text})`, channel);
    } catch(err) {
      debug(`Error while ${user.slack.id} is trying to give a break`, err);
      let errorMessage = err.name == 'LeakableBotError' ? err.message : 'problems captain!';
      this.send(`<@${user.slack.id}>, ${errorMessage}`, channel);
    }
  }


  /**
   * Continues after break or ended day by overriding the 'end' field of
   * the workday.
   * @param {String} text
   * @param {Object} user
   * @param {String} channel
   * @private
   */
  async _continue(text, user, channel) {
    try {
      let lastWorkday = await Workday.getLastWorkdayByUser(user);
      await lastWorkday.continueDay(text);
      this.send(`<@${user.slack.id}>'s workday continues with ${text}.`, channel);
    } catch(err) {
      debug(`Error while ${user.slack.id} is trying to continue work`, err);
      let errorMessage = err.name == 'LeakableBotError' ? err.message : 'problems captain!';
      this.send(`<@${user.slack.id}>, ${errorMessage}`, channel);
    }
  }


  /**
   * Ends the workday of the user.
   * @param {String} text
   * @param {Object} user
   * @param {String} channel
   * @private
   */
  async _end(text, user, channel) {
    try {
      let lastWorkday = await Workday.getLastWorkdayByUser(user);
      await lastWorkday.endDay();
      this.send(`End of the workday for <@${user.slack.id}>.`, channel);
    } catch(err) {
      debug(`Error while ${user.slack.id} is trying end the workday.`, err);
      let errorMessage = err.name == 'LeakableBotError' ? err.message : 'problems captain!';
      this.send(`<@${user.slack.id}>, ${errorMessage}`, channel);
    }
  }


  /**
   * Say something to channel.
   * @param {String} message
   * @param {String} channel
   */
  send(message, channel) {
    this.bot.rtm.sendMessage(message, this.bot.channels[channel] || channel);
  }
}

module.exports = Manager;
