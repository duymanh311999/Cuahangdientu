const router = require('express').Router();
const controllers = require('../controllers/blogCategory');
const {verifyAccessToken, isAdmin} = require('../middlewares/verifyToken')

router.post('/', [verifyAccessToken, isAdmin], controllers.createCategory);
router.get('/', verifyAccessToken, controllers.getCategories);
router.put('/:bcid', [verifyAccessToken, isAdmin], controllers.updateCategory);
router.delete('/:bcid', [verifyAccessToken, isAdmin], controllers.deleteCategory);

module.exports = router