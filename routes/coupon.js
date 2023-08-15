const router = require('express').Router();
const controllers = require('../controllers/coupon');
const {verifyAccessToken, isAdmin} = require('../middlewares/verifyToken')

router.get('/', controllers.getCoupons);
router.post('/', [verifyAccessToken, isAdmin], controllers.createNewCoupon);
router.put('/:cid', [verifyAccessToken, isAdmin], controllers.updateCoupon);
router.delete('/:cid', [verifyAccessToken, isAdmin], controllers.deleteCoupon);


module.exports = router