"use strict";

/*
 * Libraries
 */
const logger = require('koa-logger');
const config = require('config');
const mongoose = require('mongoose');
const Manager = require('./libs/manager');

mongoose.Promise = require('bluebird');
mongoose.connect(process.env.DB_LINK || config.get('database.link'));

Bot.once('connected', () => {
  const manager = new Manager(Bot);

  manager.listen();
});

module.exports = app;
