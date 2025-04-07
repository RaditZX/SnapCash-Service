const verifyFirebaseToken = require('../../middleware/firebaseMiddleware');
const PemasukanService = require('../../service/PemasukanService');

module.exports = (router) => {
    // Sign up a new user
    router.get("/pemasukanUser", verifyFirebaseToken, PemasukanService.getPemasukanUser); 
    router.post("/pemasukanUser", verifyFirebaseToken, PemasukanService.addPemasukan);
    router.put("/pemasukanUser/update/:id", verifyFirebaseToken, PemasukanService.updatePemasukan);
    router.post('/pemasukan/delete', verifyFirebaseToken, PemasukanService.deletePemasukan);
}
