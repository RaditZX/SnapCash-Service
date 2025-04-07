const PemasukanService = require("../../service/PemasukanService");
const verifyFirebaseToken = require("../../middleware/firebaseMiddleware");

module.exports = (router) => {
    // Sign up a new user
    router.get("/pemasukanUser", verifyFirebaseToken, PemasukanService.getAllPemasukan); 
    router.post("/pemasukanUser", verifyFirebaseToken, PemasukanService.addPemasukan);
}
