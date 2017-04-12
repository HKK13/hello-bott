"use strict";

const config = require('config');
const RtmClient = require('@slack/client').RtmClient;
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
    this.rtm.on(client_events.RTM.RTM_CONNECTION_OPENED, (asd) =>  this.emit('connected', asd));
    this.rtm.on(rtm_events.MESSAGE, message => this.emit('message', message));
    this.rtm.on(rtm_events.MESSAGE_CHANGED, message => this.emit('messageChanges', message));
    this.rtm.on(rtm_events.MESSAGE_DELETED, message => this.emit('messageDeleted', message));
    this.rtm.on(rtm_events.ATTEMPTING_RECONNECT, () => debug('Reconnecting'));
    this.rtm.on(rtm_events.WS_ERROR, error => debug(`Error: ${error}`));
    debug('Events created.');
  }

  authenticated(data) {
    this.data = data;
    this.id = (_.find(data.users, (user) => {
      return user.name === 'taskman';
    })).id;

    _.forEach(data.channels, (channel) => {
      this.channels[channel.name] = channel.id;
    });

    let currentChannels = Object.keys(this.channels).join(', ');
    debug(`Logged in as ${this.data.self.name} of team ${this.data.team.name}, current channels are ${currentChannels}.`);
  }
}

module.exports = new Bot();
