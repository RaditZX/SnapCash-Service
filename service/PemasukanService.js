const pemasukanRepository = require("../repository/pemasukanRepository");
const auth = require("./authService");
const PemasukanEntity = require("../Entity/PemasukanEntity");

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



class PemasukanService {
  constructor() {
    this.pemasukanRepository = pemasukanRepository;
  }

  async getPemasukanUser(userId, search, kategori, startDate, endDate, nominalMin, nominalMax) {
    try {
      // Konversi nominalMin dan nominalMax ke number jika tidak kosong
      const min = nominalMin ? Number(nominalMin) : null;
      const max = nominalMax ? Number(nominalMax) : null;
  
      // Konversi tanggal ke timestamp
      const start = startDate ? parseIndoDate(startDate) : null;
      const end = endDate ? parseIndoDate(endDate) : null;

      const result = await this.pemasukanRepository.getAllPemasukan(
        userId,
        search,
        kategori,
        start, end, min, max

      );
  
      result.forEach(item => {
        if (item.tanggal) {
          item.tanggal = formatIndoDateFromTimestamp(item.tanggal);
        }
      });
  
      return result;
    } catch (error) {
      throw new Error("Error retrieving pemasukan: " + error.message);
    }
  }
  

  async getPemasukanById(id, userId) {
    try {
      const result = await this.pemasukanRepository.getPemasukanById(id, userId);
      result.tanggal = formatIndoDateFromTimestamp(result.tanggal);
      return result;
    } catch (error) {
      throw new Error("Error retrieving pemasukan by ID: " + error.message);
    }
  }

  async addPemasukan(pemasukanData, userId) {
    try {
      pemasukanData.tanggal = parseIndoDate(pemasukanData.tanggal);
      console.log("pemasukanData", pemasukanData);
      const pemasukan = new PemasukanEntity(pemasukanData);
      const missingFields = pemasukan.validateFields();
      if (missingFields.length > 0) {
        throw new Error(`All fields are required. Missing: ${missingFields.join(", ")}`);
      }
      const newPemasukan = await this.pemasukanRepository.createPemasukan(pemasukan, userId);
      return newPemasukan;
    } catch (error) {
      console.error("Error adding pemasukan:", error);
      throw new Error("Error adding pemasukan: " + error.message);
    }
  }

  async updatePemasukan(id, updateData, userId) {
    try {
      updateData.tanggal = parseIndoDate(updateData.tanggal);
      const updatedPemasukan = await this.pemasukanRepository.updatePemasukan(id, updateData, userId);
      return updatedPemasukan;
    } catch (error) {
      throw new Error("Error updating pemasukan: " + error.message);
    }
  }

  async deletePemasukan(id, userId) {
    try {
      const deletedPemasukan = await this.pemasukanRepository.deletePemasukan(id, userId);
      return deletedPemasukan;
    } catch (error) {
      throw new Error("Error deleting pemasukan: " + error.message);
    }
  }

  async addPemasukanByGPT(pemasukanData, user) {
    try {
      pemasukanData.tanggal = parseIndoDate(pemasukanData.tanggal);
      const pemasukan = new PemasukanEntity(pemasukanData);
      const missingFields = pemasukan.validateFields();
      if (missingFields.length > 0) {
        throw new Error(`All fields are required. Missing: ${missingFields.join(", ")}`);
      }
      const userId = await auth.getUserAuthenticate(user);
      const newPemasukan = await this.pemasukanRepository.createPemasukan(pemasukan, userId);
      return newPemasukan;
    } catch (error) {
      throw new Error("Error adding pemasukan by GPT: " + error.message);
    }
  }
}

module.exports = new PemasukanService();
