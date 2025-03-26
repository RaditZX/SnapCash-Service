const { default: axios } = require("axios");
const multer = require('multer');
const fs = require('fs');
const {firebaseService} = require('./firebaseService')
const firebase = new firebaseService();
const upload = multer({ storage: multer.memoryStorage() });

class gptService{
    constructor(){}

    async postDataPengeluaran(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: "Image is required" });
            }

            // **Gunakan Firebase Storage yang sudah di-import**
            const imageUrl = await firebase.uploadImageToFirebase(req.file);

            if (!imageUrl) {
                return res.status(500).json({ error: "Failed to upload image" });
            }

            const result = await this.getInvoiceDataFromImage(imageUrl);
            return res.json(result);
        } catch (error) {
            console.error("Error processing image:", error);
            return res.status(500).json({ error: "Failed to process image" });
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
                            { type: "text", text:"dapatkan data nama produk, tanggal, toko, jumlah, subtotal, total, dan tambahan biaya lainnya berikan dalam format JSON berdasarkan tambahan biayanya, hanya JSON saja tanpa karakter escape atau \\n."}
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

            return JSON.parse(response.data.choices[0].message.content);
        } catch (error) {
            console.error('Error fetching invoice data from image:', error);
            throw error;
        }
    }


    
}

module.exports = { gptService, upload };