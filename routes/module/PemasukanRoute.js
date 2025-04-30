const verifyFirebaseToken = require('../../middleware/firebaseMiddleware');
const PemasukanController = require('../../Controller/pemasukanController');

module.exports = (router) => {
    // Sign up a new user
    router.get("/pemasukanUser", verifyFirebaseToken, PemasukanController.getPemasukanUser); 
    router.post("/pemasukanUser", verifyFirebaseToken, PemasukanController.addPemasukan);
    router.get("/pemasukanUser/:id", verifyFirebaseToken, PemasukanController.getPemasukanById);
    router.put("/pemasukanUser/update/:id", verifyFirebaseToken, PemasukanController.updatePemasukan);
    router.delete('/pemasukan/delete/:id', verifyFirebaseToken, PemasukanController.deletePemasukan);

}
