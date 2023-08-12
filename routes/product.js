const router = require('express').Router();
const controllers = require('../controllers/product');
const {verifyAccessToken, isAdmin} = require('../middlewares/verifyToken')

router.post('/',[verifyAccessToken, isAdmin], controllers.createProduct);
router.get('/', controllers.getProducts);

router.put('/:pid',[verifyAccessToken, isAdmin], controllers.updatetProduct);
router.delete('/:pid',[verifyAccessToken, isAdmin], controllers.deleteProduct);
router.get('/:pid', controllers.getProduct);

module.exports = router
