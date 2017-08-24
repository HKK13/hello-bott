"use strict";

const config = require('config');
const RtmClient = require('@slack/client').RtmClient;
const WebClient = require('@slack/client').WebClient;
const rtm_events = require('@slack/client').RTM_EVENTS;
const client_events = require('@slack/client').CLIENT_EVENTS;
const EventEmitter = require('events');
const debug = require('debug')('bot');
const _ = require('lodash');


class Bot extends EventEmitter{
  constructor() {
    super();
    this.channels = {};
    this.id = '';
    this.web = new WebClient(process.env.SLACK_TOKEN || config.get('slackToken'));
    this.rtm = new RtmClient(process.env.SLACK_TOKEN || config.get('slackToken'), {
      autoReconnect: true,
      logLevel: 'info'
    });

    this.once('authenticated', this.authenticated);

    this._initializeEvents();
    this.rtm.start();
    debug('Bot created.');
  }

  _initializeEvents() {
    this.rtm.on(client_events.RTM.AUTHENTICATED, data => this.emit('authenticated', data));
    this.rtm.on(client_events.RTM.RTM_CONNECTION_OPENED, () =>  {
      debug('Bot connected.');
      this.emit('connected');
    });
    this.rtm.on(rtm_events.MESSAGE, this._listenMentions());
    this.rtm.on(rtm_events.MESSAGE_CHANGED, message => this.emit('messageChanges', message));
    this.rtm.on(rtm_events.MESSAGE_DELETED, message => this.emit('messageDeleted', message));
    this.rtm.on(rtm_events.ATTEMPTING_RECONNECT, () => debug('Reconnecting'));
    this.rtm.on(rtm_events.WS_ERROR, error => debug(`Error: ${error}`));
    debug('Events created.');
  }

  _listenMentions(message) {
    debug('Message: %o', message);

    //If not a public or a direct message or somehow bot is mentioning itself.
    if ((message.channel[0] !== 'C' && message.channel[0] !== 'D')
      || message.user === Bot.id) {

      return;
    }

    let messageText = message.text.trim();

    if (messageText.indexOf(`<@${Bot.id}>`) == 0)
      messageText = messageText.substr(messageText.indexOf(' ') + 1);

    message.text = messageText;
    debug(`Beginning to dispatch ${message.text}`);
    this.emit('message', message);
  }

  authenticated(data) {
    this.data = data;

    this.owner = _.find(this.data.users, (user) => {
      return user.is_primary_owner;
    });
    debug('Owner is stored. %o', this.owner);

    this.id = (_.find(data.users, (user) => {
      return user.name === 'taskman';
    })).id;
    debug('Bot id is stored. %o', this.id);

    _.forEach(data.channels, (channel) => {
      this.channels[channel.name] = channel.id;
    });
    debug('Channels are stored. %o', this.channels);

    let currentChannels = Object.keys(this.channels).join(', ');
    debug(`Logged in as ${this.data.self.name} of team ${this.data.team.name}, current channels are ${currentChannels}.`);
  }
}

module.exports = new Bot();
