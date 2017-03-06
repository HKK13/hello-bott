const Router = require('koa-router');
const router = new Router();

router.get('/', async (ctx, next) => {
  //TODO: WTF? :D
  ctx.type = 'json';
  ctx.body = {"res": "Hello World"}
});

module.exports = router;
