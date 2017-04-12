"use strict";


/*
 * Libraries
 */
const Koa = require('koa');
const Router = require('koa-router');
const logger = require('koa-logger');
const bodyParser = require('koa-bodyparser');
const Bot = require('./libs/bot');

Bot.once('connected', () => {
  console.log('Connected');
  const manager = require('./libs/manager');
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
