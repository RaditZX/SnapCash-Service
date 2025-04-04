const express = require('express');
const router = express.Router();
const { gptService, upload } = require('../service/gptService');

const gpt = new gptService();

/* GET home page. */
require('./module/AuthRoute')(router);
require('./module/PengeluaranRoute')(router);
router.post('/generateInvoiceData', upload.single('image'), (req, res) => gpt.postDataPengeluaranOrPemasukanUsingGPT(req, res));

module.exports = router;
