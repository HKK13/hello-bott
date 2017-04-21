"use strict";

/*
 * Libraries
 */
const Koa = require('koa');
const Router = require('koa-router');
const logger = require('koa-logger');
const bodyParser = require('koa-bodyparser');
const Bot = require('./libs/bot');
const config = require('config');
const mongoose = require('mongoose');
const Manager = require('./libs/manager');
const UserCommands = require('./libs/commands/user');

mongoose.Promise = require('bluebird');
mongoose.connect(process.env.DB_LINK || config.get('database.link'));

Bot.once('connected', () => {
  const manager = new Manager(Bot);

  manager.listen();
});

/*
 * Instance objects.
 */
const app = new Koa();
const router = new Router();


/*
 * App configurations.
 */
app
  .use(logger())
  .use(router.routes())
  .use(router.allowedMethods())
  .use(bodyParser());


app.listen(3000);

module.exports = app;
