'use strict';

const _ = require('lodash');
const User = require('../../models/user');
const debug = require('debug')('userCommand');
const config = require('config');
const WebClient = require('@slack/client').WebClient;
const LeakableBotError = require('../errors/leakableError');


class UserCommand{
  constructor(bot) {
    this.bot = bot;
    this.web = new WebClient(process.env.SLACK_TOKEN || config.get('slackToken'));
  }


  /**
   * Dispatches provided message to corresponding functions.
   *
   * @param {String} message
   * @param {Object} user
   */
  async dispatchCommand(message, user) {
    try {
      debug('Starting to dispatch message');
      let command = '_' + (message.text.substr(0, message.text.indexOf(' '))
        || message.text).toLowerCase();

      let text = '';

      //Some functions does not need params
      if (message.text.indexOf(' ') != -1)
        text = message.text.substr(message.text.indexOf(' ') + 1);

      // Only for this case user can be both slack user object or
      // our user object therefore we need this kind of hacking
      // limited only to this module.
      let slackId = user.is_owner ? user.id : user.slack.id;

      debug(`Received command '${command}' from user ${slackId}.`);
      this[command](text, user, message.channel);
    } catch(err) {
      debug(`Command '${command} is failed to be dispatched.'`, err);
      let errorMessage = err.name == 'LeakableBotError' ? err.message : 'problems captain!';
      this.bot.rtm.sendMessage(`<@${user.slack.id}>, ${errorMessage}`, message.channel);
    }
  }


  /**
   * Deletes user from the taskman database.
   *
   * @param text
   * @param user
   * @param channel
   * @private
   */
  async _delete(text, user, channel) {
    try {
      if (!user.isOwner)
        throw new LeakableBotError('Only team owners can delete users.');
      if (text.indexOf('<@') == -1)
        throw new LeakableBotError('need a single user mention.');

      let slackId = text.split('@')[1].split('>')[0];
      await User.findOneAndRemove({'slack.id': slackId});

      this.bot.rtm.sendMessage(`<@${user.slack.id}> deleted ${text} from taskman database.`, channel);
    } catch(err) {
      debug(`Error while ${user.slack.id} is trying to delete a user; ${text}.`, err);
      let errorMessage = err.name == 'LeakableBotError' ? err.message : 'problems captain!';
      this.send(`<@${user.slack.id}>, ${errorMessage}`, channel);
    }
  }


  /**
   * Creates user that is mentioned or self if the provided
   * parameter is 'me'. For the first time owner needs to
   * creates his or her database entry then others.
   *
   * Slack admins and owners can create user entries.
   *
   * @param {String} text
   * @param {Object} user
   * @param {String} channel
   * @private
   */
  async _create(text, user, channel) {
    try {
      if(!user.isOwner && !user.isAdmin && !user.is_owner && !user.is_admin) {
        debug(`User ${user.slack.id} is not an owner or admin.`);
        throw new LeakableBotError(`only team owners can create users.`);
      }

      if(!text || text.indexOf('<@') == -1) {
        debug(`User ${user.slack.id} did not provide enough parameters.`);
        throw new LeakableBotError(`need a single user mention.`);
      }

      let slackId = text.split('@')[1].split('>')[0];
      let slackUser = (await this.web.users.info(slackId)).user;
      debug(`Got user ${slackUser.id} from slack`);

      if(slackUser.real_name) {
        let splitNames = slackUser.real_name.split(' ');
        var firstName = splitNames.splice(0, splitNames.length-1).join(' ');
        var lastName = splitNames[splitNames.length-1];
      }

      let newUser = new User({
        firstName: firstName || '',
        lastName: lastName || '',
        email: slackUser.profile.email,
        isAdmin: slackUser.is_admin,
        isOwner: slackUser.is_owner,
        slack: {
          id: slackUser.id,
          name: slackUser.name
        }
      });

      newUser = await newUser.save();

      // User variable might not yet fit our schema.
      let callerId = user.is_owner ? user.id : user.slack.id;
      this.bot.rtm.sendMessage(`<@${callerId}> created user ${text == 'me' ? 'self': text}`, channel);
    } catch(err) {
      debug(`Error while trying to create a user; ${text}.`, err);
      let errorMessage = err.name == 'LeakableBotError' ? err.message :
        'problems captain! Might be a duplicate!';
      let slackId = user.is_owner ? user.id : user.slack.id;
      this.bot.rtm.sendMessage(`<@${slackId}>, ${errorMessage}`, channel);
    }

  }


  async _update(text, user, channel) {
    try {
      if (!text || text.indexOf('<@') == -1)
        throw new LeakableBotError('no mentions provided.');

      let slackId = text.split('@')[1].split('>')[0];

      if (slackId != user.slack.id && !user.isOwner && !user.isAdmin)
        throw new LeakableBotError('permission denied.');

      let slackUser = (await this.web.users.info(slackId)).user;
      debug(`Got user ${slackUser.id} from slack`);

      let dbUser = await User.findOne({'slack.id': slackUser.id});
      debug(`Got user ${dbUser.slack.id} from database`);

      if(slackUser.real_name) {
        let splitNames = slackUser.real_name.split(' ');
        var firstName = splitNames.splice(0, splitNames.length-1).join(' ');
        var lastName = splitNames[splitNames.length-1];
      }

      await dbUser.update({
        firstName: firstName || '',
        lastName: lastName || '',
        email: slackUser.profile.email,
        isAdmin: slackUser.is_admin,
        isOwner: slackUser.is_owner,
        slack: {
          id: slackUser.id,
          name: slackUser.name
        }
      });

      this.bot.rtm.sendMessage(`<@${user.slack.id}> updated user <@${dbUser.slack.id}> successfully.`, channel);
    } catch(err) {
      debug(`Error while trying to create a user; ${text}.`, err);
      let errorMessage = err.name == 'LeakableBotError' ? err.message : 'problems captain!';
      this.bot.rtm.sendMessage(`<@${user.slack.id}>, ${errorMessage}`, channel);
    }

  }

}


module.exports = UserCommand;
