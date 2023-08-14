const router = require('express').Router();
const controllers = require('../controllers/blog');
const {verifyAccessToken, isAdmin} = require('../middlewares/verifyToken');

router.get('/', controllers.getBlog);
router.put('/like', verifyAccessToken, controllers.likeBlog);
router.post('/', [verifyAccessToken, isAdmin], controllers.createNewBlog);
router.put('/:bid', [verifyAccessToken, isAdmin], controllers.updateBlog);

module.exports = router