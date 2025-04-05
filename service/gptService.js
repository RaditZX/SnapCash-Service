const { default: axios } = require("axios");
const multer = require('multer');
const {firebaseService} = require('./firebaseService');
const {addPengeluaranByGPT } = require("../service/PengeluaranService");
const { sendResponse } = require("../response");
const { addPemasukanByGPT } = require("./PemasukanService");
const firebase = new firebaseService();
const upload = multer({ storage: multer.memoryStorage() });

class gptService{
    constructor(){
        this.firebase = firebase;
    }

   postDataPengeluaranOrPemasukanUsingGPT =  async (req, res) => {
        try {
            // Validasi file
            if (!req.file) {
                return res.status(400).json({ error: "Image is required" });
            }
    
            const imageUrl = await this.firebase.uploadImageToFirebase(req.file);
            if (!imageUrl) {
                return res.status(500).json({ error: "Failed to upload image" });
            }
            const user = req.user;
            const invoiceData = await this.getInvoiceDataFromImage(imageUrl);

            if (!invoiceData) {
                return res.status(500).json({ error: "Failed to process invoice data" });
            }
    
            const transactionType = this.determineIsPemasukanOrPengeluaran(invoiceData);
            const result = await this.saveTransaction(transactionType, invoiceData, user);
    
            return sendResponse(200, result, "Data successfully processed", res, true);
        } catch (error) {
            console.error("Error processing image:", error);
            return sendResponse(500, req.body, error.message, res);
        }
    }


    async getInvoiceDataFromImage(imageData) {
        try {
            const response = await axios.post(process.env.AI_BASE_URL + '/chat/completions', {
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "image_url", "image_url": {
                                url: imageData
                            },
                        },
                            { type: "text", text:"dapatkan data namaPengeluaran, tanggal, toko, jumlah, subtotal, total, dan tambahanBiaya. Tentukan apakah struk ini termasuk pengeluaran atau pemasukan dalam atribut isPengeluaran (boolean). Jika isPengeluaran bernilai false, ubah namaPengeluaran menjadi namaPemasukan dan toko menjadi sumber. jika struk merupakan aktivitas bank jadikan bank sebagai toko atau sumber. Susun hasilnya berdasarkan tambahanBiaya secara berurutan berikan dalam format JSON berdasarkan tambahan biayanya.  hanya JSON saja tanpa karakter escape atau \\n."}
                        ]
                    }
                ],
                model: process.env.AI_MODEL,
                max_tokens: 4096
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.AI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            return JSON.parse(response.data.choices[0].message.content)[0];
        } catch (error) {
            console.error('Error fetching invoice data from image:', error);
            throw error;
        }
    }

    determineIsPemasukanOrPengeluaran(data) {
        const { isPengeluaran } = data;
        console.log("isPengeluaran:", isPengeluaran);
        if (isPengeluaran === true) {
            return "pengeluaran";
        } else if (isPengeluaran === false) {
            return "pemasukan";
        } else {
            return "unknown";
        }
    }

        
    async saveTransaction(transactionType, invoiceData, user) {
        if (transactionType === "pemasukan") {
            return await addPemasukanByGPT(invoiceData, user);
        } else if (transactionType === "pengeluaran") {
            return await addPengeluaranByGPT(invoiceData, user);
        } else {
            throw new Error("Invalid transaction type");
        }
    }

    
}

module.exports = { gptService, upload };