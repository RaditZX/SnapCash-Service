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

  async getTotalUsers() {
    try {
      const usersRef = this.db.collection("users");
      const snapshot = await usersRef.get();
      return snapshot.size;
    } catch (error) {
      console.error("Error retrieving total users:", error);
      throw new Error("Error retrieving total users");
    }
  }
  async getUserRegistrationDataCount({ startDate, endDate, groupBy = "day" }) {
    try {
      const usersRef = this.db.collection("users");

      const start = moment(startDate).startOf("day").toDate();
      const end = moment(endDate).endOf("day").toDate();

      const snapshot = await usersRef
        .where("createdAt", ">=", start)
        .where("createdAt", "<=", end)
        .get();

      const groupedRegistrations = {};
      let totalUsers = 0;

      snapshot.forEach(doc => {
        const userData = doc.data();
        const createdAt = userData.createdAt?.toDate?.();
        if (!createdAt) return;

        totalUsers++;

        let key;
        switch (groupBy) {
          case "day":
            key = moment(createdAt).format("YYYY-MM-DD");
            break;
          case "month":
            key = moment(createdAt).format("YYYY-MM");
            break;
          case "year":
            key = moment(createdAt).format("YYYY");
            break;
          default:
            key = moment(createdAt).format("YYYY-MM-DD");
        }

        if (!groupedRegistrations[key]) {
          groupedRegistrations[key] = 1;
        } else {
          groupedRegistrations[key]++;
        }
      });

      return {
        totalUsers,
        groupedRegistrations
      };

    } catch (error) {
      console.error("Error retrieving user registration data count:", error);
      throw new Error("Error retrieving user registration data count");
    }
  }

  async getTotalEachKategori(jenis) {
    try {
      console.log("Retrieving total count for each category in:", jenis.jenis);
      const snapshot = await this.db.collection(jenis.jenis).get();
      const totalKategori = {};

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.tanggal || !data.kategori) return;

        const kategori = data.kategori;

        if (!totalKategori[kategori]) {
          totalKategori[kategori] = 0;
        }

        // Tambah 1 untuk setiap dokumen dengan kategori tersebut
        totalKategori[kategori] += 1;
      });

      return totalKategori;
    } catch (error) {
      console.error("Error retrieving count by category:", error);
      throw new Error("Error retrieving count by category");
    }
  }

}

module.exports = new DashboardRepository();
