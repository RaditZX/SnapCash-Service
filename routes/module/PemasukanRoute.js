const verifyFirebaseToken = require('../../middleware/firebaseMiddleware');
const PemasukanService = require('../../service/PemasukanService');

module.exports = (router) => {
    // Sign up a new user
    router.get("/pemasukanUser", verifyFirebaseToken, PemasukanService.getPemasukanUser); 
    router.post("/pemasukanUser", verifyFirebaseToken, PemasukanService.addPemasukan);
    router.get("/pemasukanUser/:id", verifyFirebaseToken, PemasukanService.getPemasukanById);
    router.put("/pemasukanUser/update/:id", verifyFirebaseToken, PemasukanService.updatePemasukan);
    router.post('/pemasukanUser/delete/:id', verifyFirebaseToken, PemasukanService.deletePemasukan);

}
