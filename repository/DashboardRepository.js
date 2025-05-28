const admin = require("firebase-admin");
const moment = require("moment");

class DashboardRepository {
  constructor() {
    this.db = admin.firestore();
  }

 getDataByJenisDanWaktu = async (
  userId,
  jenis,
  filter,
  tahun,
  bulan,
  hari
) => {
  let snapshot;

  if (filter === "tahun") {
    const startOfYear = moment().year(tahun).startOf("year").toDate();
    const endOfYear = moment().year(tahun).endOf("year").toDate();

    snapshot = await this.db
      .collection(jenis)
      .where("userId", "==", userId)
      .where("tanggal", ">=", startOfYear)
      .where("tanggal", "<=", endOfYear)
      .get();

  } else if (filter === "bulan") {
    // Gunakan bulan sekarang jika bulan tidak diberikan
    const validBulan = bulan || moment().month() + 1;

    // Ambil 4 bulan ke belakang termasuk bulan sekarang (5 bulan total)
    const startOfRange = moment()
      .year(tahun)
      .month(validBulan - 1)
      .subtract(4, "months") // 4 bulan ke belakang
      .startOf("month")
      .toDate();

    const endOfRange = moment()
      .year(tahun)
      .month(validBulan - 1)
      .endOf("month")
      .toDate();

    snapshot = await this.db
      .collection(jenis)
      .where("userId", "==", userId)
      .where("tanggal", ">=", startOfRange)
      .where("tanggal", "<=", endOfRange)
      .get();

  } else if (filter === "hari") {
    // Pastikan bulan dan hari valid
    const validBulan = bulan || moment().month() + 1;
    const validHari = hari || moment().date();

    const targetDate = moment(`${tahun}-${validBulan}-${validHari}`, "YYYY-M-D");

    const startOfRange = targetDate.clone().subtract(4, "days").startOf("day").toDate();
    const endOfRange = targetDate.clone().endOf("day").toDate();

    snapshot = await this.db
      .collection(jenis)
      .where("userId", "==", userId)
      .where("tanggal", ">=", startOfRange)
      .where("tanggal", "<=", endOfRange)
      .get();
  }

  return snapshot;
};


  async getDataByRange(userId, jenis, startDate, endDate) {
    try {
      const snapshot = await this.db
        .collection(jenis)
        .where("userId", "==", userId)
        .where("tanggal", ">=", startDate)
        .where("tanggal", "<=", endDate)
        .get();
      return snapshot;
    } catch (error) {
      console.error("Error retrieving data by range:", error);
      throw new Error("Error retrieving data by range");
    }
  }
}

module.exports = new DashboardRepository();
