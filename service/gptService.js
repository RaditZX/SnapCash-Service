const { default: axios } = require("axios");
const multer = require('multer');
const {firebaseService} = require('./firebaseService');
const pengeluaranService = require("./PengeluaranService");
const { sendResponse } = require("../response");
const pemasukanService = require("./PemasukanService");
const firebase = new firebaseService();
const upload = multer({ storage: multer.memoryStorage() });
const sharp = require("sharp");


class gptService{
    constructor(){
        this.firebase = firebase;
    }

    postDataPengeluaranOrPemasukanUsingGPT = async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: "Image is required" });
            }
    
            const buffer = Buffer.from(req.file.buffer); // Konversi dari ArrayBuffer ke Buffer

            const compressedImage = await sharp(buffer)
              .jpeg({ quality: 70 }) // Kompresi gambar dengan kualitas 80%
              .toBuffer();
            
            const imageUrl = await this.firebase.uploadImageToFirebase(compressedImage);
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
            const response = await axios.post(
                process.env.AI_BASE_URL + '/chat/completions',
                {
                    messages: [
                        {
                            role: "user",
                            content: [
                                {
                                    type: "image_url",
                                    image_url: { url: imageData }
                                },
                                {
                                    type: "text",
                                    text:"Dapatkan data dari struk berupa namaPengeluaran, tanggal, toko, total, kategori seperti (gaji, transportasi, makanan&minuman, Belanja) , dan tambahanBiaya berisi namaBiaya dan jumlah yang dibungkus dalam array. Tentukan apakah transaksi dalam struk tersebut merupakan pengeluaran atau pemasukan dengan menambahkan atribut isPengeluaran bertipe boolean. Jika isPengeluaran bernilai false (pemasukan), ubah atribut namaPengeluaran menjadi namaPemasukan dan atribut toko menjadi sumber. Jika struk menunjukkan aktivitas bank, gunakan nama bank tersebut sebagai nilai dari toko atau sumber, tergantung jenis transaksinya. Format tanggal harus diubah menjadi bentuk yang lengkap seperti “21 Maret 2025, 12:12:52 WIB”. Jika isPengeluaran bernilai true (pengeluaran), tambahkan atribut barang yang merupakan objek berisi daftar barang yang dibeli. Setiap item dalam daftar ini harus mencakup namaBarang, jumlah, harga (>0). Susun hasilnya berdasarkan tambahanBiaya secara berurutan berikan dalam format JSON berdasarkan tambahan biayanya.  hanya JSON saja tanpa karakter escape atau \\n yang dibungkus dalam array."
                                }
                            ]
                        }
                    ],
                    model: process.env.AI_MODEL,
                    max_tokens: 1500
                },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.AI_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                }
            );
    
            console.log("Response from AI:", response.data.choices[0].message.content);
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
            return await pemasukanService.addPemasukanByGPT(invoiceData, user);
        } else if (transactionType === "pengeluaran") {
            return await pengeluaranService.addPengeluaranByGPT(invoiceData, user);
        } else {
            throw new Error("Invalid transaction type");
        }
    }

    
}

module.exports = { gptService, upload };
