const router = require('express').Router();
const controllers = require('../controllers/blog');
const {verifyAccessToken, isAdmin} = require('../middlewares/verifyToken');
const uploader = require('../config/cloudinary.config')

router.get('/', controllers.getBlog);
router.post('/', [verifyAccessToken, isAdmin], controllers.createNewBlog);
router.get('/one/:bid', controllers.getBlogs);
router.put('/like/:bid', verifyAccessToken, controllers.likeBlog);
router.put('/uploadimage/:bid', [verifyAccessToken, isAdmin],uploader.single('image'), controllers.uploadImagesBlog);
router.put('/dislike/:bid', verifyAccessToken, controllers.dislikeBlog);
router.put('/:bid', [verifyAccessToken, isAdmin], controllers.updateBlog);
router.delete('/:bid', [verifyAccessToken, isAdmin], controllers.deleteBlogs);

module.exports = router