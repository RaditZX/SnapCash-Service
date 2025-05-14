const PengeluaranRepository = require("../repository/pengeluaranRepository");
const PengeluaranEntity = require("../Entity/PengeluaranEntity");
const auth = require("./authService");

function parseIndoDate(str) {
    const bulanMap = {
      Januari: "01",
      Februari: "02",
      Maret: "03",
      April: "04",
      Mei: "05",
      Juni: "06",
      Juli: "07",
      Agustus: "08",
      September: "09",
      Oktober: "10",
      November: "11",
      Desember: "12",
    };
  
    const regex = /(\d{1,2}) (\w+) (\d{4}), (\d{2}:\d{2}:\d{2})/;
    const match = str.match(regex);
  
    if (!match) return null;
  
    const [_, day, bulanText, year, time] = match;
    const month = bulanMap[bulanText];
    if (!month) return null;
  
    const formatted = `${year}-${month}-${day.padStart(2, "0")}T${time}`;
    return new Date(formatted);
  }
  
  
  function formatIndoDateFromTimestamp(timestamp) {
    if (!timestamp || typeof timestamp.toDate !== 'function') {
      throw new Error("Input bukan Firebase Timestamp yang valid.");
    }
  
    const dateObj = timestamp.toDate(); // Konversi dari Firebase Timestamp ke JavaScript Date
  
    const bulanMap = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
  
    const day = dateObj.getDate().toString().padStart(2, "0");
    const month = bulanMap[dateObj.getMonth()];
    const year = dateObj.getFullYear();
  
    const hours = dateObj.getHours().toString().padStart(2, "0");
    const minutes = dateObj.getMinutes().toString().padStart(2, "0");
    const seconds = dateObj.getSeconds().toString().padStart(2, "0");
  
    return `${day} ${month} ${year}, ${hours}:${minutes}:${seconds}`;
  }
  

class PengeluaranService {
    constructor() {
        this.repository = PengeluaranRepository;
    }

    async getPengeluaran(userId, search, kategori, startDate, endDate, nominalMin, nominalMax) {
        // Konversi nominalMin dan nominalMax ke number jika tidak kosong
        const min = nominalMin ? Number(nominalMin) : null;
        const max = nominalMax ? Number(nominalMax) : null;
    
        // Konversi tanggal ke timestamp
        const start = startDate ? parseIndoDate(startDate) : null;
        const end = endDate ? parseIndoDate(endDate) : null;
    
        // Ambil data dari repository
        const pengeluaranData = await this.repository.getAllPengeluaran(
            userId, search, kategori, start, end, min, max
        );
    
        pengeluaranData.forEach(item => {
            if (item.tanggal) {
              item.tanggal = formatIndoDateFromTimestamp(item.tanggal);
            }
          });
      
          return pengeluaranData;
    }
    

    async getPengeluaranById(id, userId) {
        const result = await this.repository.getPengeluaranById(id, userId);
        result.tanggal = formatIndoDateFromTimestamp(result.tanggal);
        if (!result) {
            throw new Error("Pengeluaran not found");
        }
        if (result.userId !== userId) {
            throw new Error("Unauthorized access to this pengeluaran");
        }
        return result;
    }

    async addPengeluaran(pengeluaranData, userId) {
        pengeluaranData.tanggal = parseIndoDate(pengeluaranData.tanggal);
        const pengeluaran = new PengeluaranEntity(pengeluaranData)
        const missingFields = pengeluaran.validateFields();
        if (missingFields.length > 0) {
            throw new Error(`All fields are required. Missing: ${missingFields.join(", ")}`);
        }
        return await this.repository.addPengeluaran(pengeluaran.getFilledFields(), userId);
    }

    async updatePengeluaran(id, pengeluaranData, userId) {
        pengeluaranData.tanggal = parseIndoDate(pengeluaranData.tanggal);
        const pengeluaran = new PengeluaranEntity(pengeluaranData)
        if (!pengeluaran.hasAnyValue()) {
            throw new Error("Minimal satu field harus diisi untuk melakukan update.");
        }
        return await this.repository.updatePengeluaran(id, pengeluaran.getFilledFields(), userId);
    }

    async deletePengeluaran(id, userId) {
        return await this.repository.deletePengeluaran(id, userId);
    }

    async addPengeluaranByGPT(pengeluaranData, user) {
        pengeluaranData.tanggal = parseIndoDate(pengeluaranData.tanggal);
        const pengeluaran = new PengeluaranEntity(pengeluaranData);
        const missingFields = pengeluaran.validateFields();
        if (missingFields.length > 0) {
            throw new Error(`All fields are required. Missing: ${missingFields.join(", ")}`);
        }
        const userId = await auth.getUserAuthenticate(user);
        return await this.repository.addPengeluaran(pengeluaran.getFilledFields(), userId);
    }
}

module.exports = new PengeluaranService();
