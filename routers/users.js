const Router = require('koa-router');
const router = new Router();

router.get('/', async (ctx, next) => {
  ctx.body = "Hello Users"
});

module.exports = router;
