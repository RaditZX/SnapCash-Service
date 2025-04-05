const express = require('express');
const router = express.Router();
const { gptService, upload } = require('../service/gptService');
const verifyFirebaseToken = require('../middleware/firebaseMiddleware');

const gpt = new gptService();

/* GET home page. */
require('./module/AuthRoute')(router);
require('./module/PengeluaranRoute')(router);
require('./module/PemasukanRoute')(router);
router.post(
    '/generateInvoiceData',
    upload.single('image'),
    verifyFirebaseToken,
    gpt.postDataPengeluaranOrPemasukanUsingGPT
  );
  

module.exports = router;
