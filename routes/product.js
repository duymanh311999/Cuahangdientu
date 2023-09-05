const router = require('express').Router();
const controllers = require('../controllers/product');
const {verifyAccessToken, isAdmin} = require('../middlewares/verifyToken');
const uploader = require('../config/cloudinary.config')

router.post('/',[verifyAccessToken, isAdmin], uploader.fields([
    {name: 'images', maxCount: 10},
    {name: 'thumb', maxCount: 1},
]), controllers.createProduct);
router.get('/', controllers.getProducts);
router.put('/ratings',[verifyAccessToken], controllers.ratings);

router.put('/uploadimages/:pid',[verifyAccessToken, isAdmin], uploader.fields('images', 10), controllers.uploadImagesProduct);
router.put('/varriant/:pid',verifyAccessToken, isAdmin, uploader.fields([
    {name: 'images', maxCount: 10},
    {name: 'thumb', maxCount: 1},
]), controllers.addvarriant);
router.put('/:pid',verifyAccessToken, isAdmin, uploader.fields([
    {name: 'images', maxCount: 10},
    {name: 'thumb', maxCount: 1},
]), controllers.updateProduct);
router.delete('/:pid',[verifyAccessToken, isAdmin], controllers.deleteProduct);
router.get('/:pid', controllers.getProduct);

module.exports = router
