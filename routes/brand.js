const router = require('express').Router();
const controllers = require('../controllers/brand');
const {verifyAccessToken, isAdmin} = require('../middlewares/verifyToken')

router.post('/', [verifyAccessToken, isAdmin], controllers.createNewBrand);
router.get('/', controllers.getBrands);
router.put('/:bid', [verifyAccessToken, isAdmin], controllers.updateBrand);
router.delete('/:bid', [verifyAccessToken, isAdmin], controllers.deleteBrand);

module.exports = router