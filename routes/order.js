const router = require('express').Router();
const controllers = require('../controllers/order');
const {verifyAccessToken, isAdmin} = require('../middlewares/verifyToken');

router.get('/', verifyAccessToken, controllers.getUserOrder)
router.post('/', verifyAccessToken, controllers.createNewOder)
router.get('/admin', [verifyAccessToken, isAdmin], controllers.getOrders)
router.put('/status/:oid', [verifyAccessToken, isAdmin], controllers.updateStatus)


module.exports = router
