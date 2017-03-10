"use strict";


/*
 * Libraries
 */
const Koa = require('koa');
const Router = require('koa-router');
const logger = require('koa-logger');
const bodyParser = require('koa-bodyparser');
const SlackCore = require('sourcebot').Slack;
const SlackBot = new SlackCore({
  token: 'xoxb-152823150231-Wkj09ybiLxB2vQMsBB8vpKi1'
});


SlackBot
  .connect()
  .then((bot) => {
    bot
      .listen('hello', (response) => {
        bot.send({
          channel: response.channel,
          text: 'world'
        });
      })
  })
  .catch((err) => console.error(err.message));

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
