const verifyFirebaseToken = require('../../middleware/firebaseMiddleware');
const CurrencyController = require('../../Controller/currencyController');

module.exports = (router) => {

    router.get("/currency", verifyFirebaseToken, CurrencyController.getCurrency); 
    router.post("/addCurrency", verifyFirebaseToken,CurrencyController.addCurrency);
    router.get("/currency/:id", verifyFirebaseToken, CurrencyController.getCurrencyById);   
    router.put("/currency/update/:id", verifyFirebaseToken, CurrencyController.updateCurrency);
    router.delete('/currency/delete/:id', verifyFirebaseToken, CurrencyController.deleteCurrency);
    


}
