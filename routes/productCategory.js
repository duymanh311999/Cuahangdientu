const router = require('express').Router();
const controllers = require('../controllers/productCategory');
const {verifyAccessToken, isAdmin} = require('../middlewares/verifyToken')

router.post('/', [verifyAccessToken, isAdmin], controllers.createCategory);
router.get('/', verifyAccessToken, controllers.getCategories);
router.put('/:pcid', [verifyAccessToken, isAdmin], controllers.updateCategory);
router.delete('/:pcid', [verifyAccessToken, isAdmin], controllers.deleteCategory);

module.exports = router