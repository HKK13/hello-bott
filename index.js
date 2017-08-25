"use strict";

/*
 * Libraries
 */
const logger = require('koa-logger');
const config = require('config');
const mongoose = require('mongoose');
const Manager = require('./libs/Manager');
const Bot = require('./libs/Bot');
const ModuleCore = require('./libs/ModuleCore');

mongoose.Promise = require('bluebird');
mongoose.connect(process.env.DB_LINK || config.get('database.link'));

Bot.once('connected', () => {
  Bot.on('manager_message', () => console.log('heyyyy'));
});


module.exports = {
  Manager,
  Bot,
  ModuleCore
};
