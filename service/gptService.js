const { default: axios } = require("axios");
const multer = require('multer');
const {firebaseService} = require('./firebaseService');
const pengeluaranService = require("./PengeluaranService");
const { sendResponse } = require("../response");
const pemasukanService = require("./PemasukanService");
const firebase = new firebaseService();
const upload = multer({ storage: multer.memoryStorage() });
const sharp = require("sharp");
const authRepository = require("../repository/authRepository");



class gptService{
    constructor(){
        this.firebase = firebase;
    }

    postDataPengeluaranOrPemasukanUsingGPT = async (req, res) => {
        try {
            const limit = await checkLimitOCR(req.user.uid);
            if (limit.data === -1) {
                return sendResponse(403, req.body, limit.message, res, false);
            }

            if (!req.file) {
                return sendResponse(400, req.body, "No file uploaded", res,false);
            }
    
            const buffer = Buffer.from(req.file.buffer); // Konversi dari ArrayBuffer ke Buffer

            const compressedImage = await sharp(buffer)
              .jpeg({ quality: 70 }) // Kompresi gambar dengan kualitas 80%
              .toBuffer();
            
            const imageUrl = await this.firebase.uploadImageToFirebase(compressedImage);
            if (!imageUrl) {
                return sendResponse(500, req.body, "Failed to upload image", res,false);
            }
    
            const user = req.user;
            const invoiceData = await this.getInvoiceDataFromImage(imageUrl);
    
            if (!invoiceData) {
                return sendResponse(400, req.body, "No invoice data found in the image", res,false);
            }
    
            const transactionType = this.determineIsPemasukanOrPengeluaran(invoiceData);
            const result = await this.saveTransaction(transactionType, invoiceData, user);

            updateOcrUsage(user.uid);
            return sendResponse(200, result, "Data successfully processed", res, true);
        } catch (error) {
            console.error("Error processing image:", error);
            return sendResponse(500, req.body, error.message, res, false);
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
                                    text:"Dapatkan data dari struk berupa namaPengeluaran, tanggal, toko, total, subTotal, kategori seperti (kategori pengeluaran: Kebutuhan Rumah Tangga,Transportasi,Belanja,Makanan,Kesehatan,Pendidikan&Pelatihan,Hiburan,Keuangan&Investasi,Pajak&Iuran,Lain-lain) (Kategori pemasukan: Gaji,PendapatanSampingan,Usaha,DividenInvestasi,PenjualanAset,Transfer,Hadiah,PengembalianPajak) , dan tambahanBiaya berisi namaBiaya dan jumlah yang dibungkus dalam array. Tentukan apakah transaksi dalam struk tersebut merupakan pengeluaran atau pemasukan dengan menambahkan atribut isPengeluaran bertipe boolean. Jika isPengeluaran bernilai false (pemasukan), ubah atribut namaPengeluaran menjadi namaPemasukan dan atribut toko menjadi sumber. Jika struk menunjukkan aktivitas bank, gunakan nama bank tersebut sebagai nilai dari toko atau sumber, tergantung jenis transaksinya. Format tanggal harus diubah menjadi bentuk yang lengkap seperti “21 Maret 2025, 12:12:52”. Jika isPengeluaran bernilai true (pengeluaran), tambahkan atribut barang yang merupakan objek berisi daftar barang yang dibeli. Setiap item dalam daftar ini harus mencakup namaBarang, jumlah, harga (>0). Susun hasilnya berdasarkan tambahanBiaya secara berurutan berikan dalam format JSON berdasarkan tambahan biayanya.  hanya JSON saja tanpa karakter escape atau \\n yang dibungkus dalam array. Kalau image bukan sebuah invoce kembalikan pesan saja"
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


 const updateOcrUsage = async (userId) => {
  try {
    const user = await authRepository.getUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const limitOCR = user.limitOCR;
    if (!limitOCR || limitOCR.used >= limitOCR.limit) {
      return {
        status: 403,
        message: "Limit OCR has been reached",
      };
    }

    // Increment the used count
    limitOCR.used += 1;
    await authRepository.updateUser(userId, { limitOCR });

    return {
      status: 200,
      data: limitOCR,
      message: "Limit OCR usage updated successfully",
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const checkLimitOCR = async (userId) => {
  try {
    const user = await authRepository.getUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const limitOCR = user.limitOCR;
    if (!limitOCR || limitOCR.used >= limitOCR.limit) {
      return {
        status: 403,
        data : -1,
        message: "Limit OCR has been reached",
      };
    }

    return {
      status: 200,
      data: limitOCR,
      message: "Limit OCR is available",
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
};




module.exports = { gptService, upload };
