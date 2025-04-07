const verifyFirebaseToken = require('../../middleware/firebaseMiddleware');
const PemasukanService = require('../../service/PemasukanService');

module.exports = (router) => {
    // Get all pemasukan
    router.get('/pemasukan',verifyFirebaseToken, PemasukanService.getPemasukanById);
    router.post('/pemasukan/add', verifyFirebaseToken, PemasukanService.addPemasukan);
    router.post('/pemasukan/delete', verifyFirebaseToken, PemasukanService.deletePemasukan);
}
