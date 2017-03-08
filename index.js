/*
 * Libraries
 */
const Koa = require('koa');
const Router = require('koa-router');
const logger = require('koa-logger');
const bodyParser = require('koa-bodyparser');

/*
 * Instance objects.
 */
const app = new Koa();
const router = new Router();

/*
 * Routers
 */
const index = require('./routers/index');
const users = require('./routers/users');


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
