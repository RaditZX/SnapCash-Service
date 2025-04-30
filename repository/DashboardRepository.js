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
        .where("updatedAt", ">=", startOfYear)
        .where("updatedAt", "<=", endOfYear)
        .get();
    } else if (filter === "bulan") {
      const startOfMonth = moment()
        .year(tahun)
        .month(bulan - 1)
        .startOf("month")
        .toDate();
      const endOfMonth = moment()
        .year(tahun)
        .month(bulan - 1)
        .endOf("month")
        .toDate();

      snapshot = await this.db
        .collection(jenis)
        .where("userId", "==", userId)
        .where("updatedAt", ">=", startOfMonth)
        .where("updatedAt", "<=", endOfMonth)
        .get();
    } else if (filter === "hari") {
      const startOfDay = moment(`${tahun}-${bulan}-${hari}`)
        .startOf("day")
        .toDate();
      const endOfDay = moment(`${tahun}-${bulan}-${hari}`)
        .endOf("day")
        .toDate();

      snapshot = await this.db
        .collection(jenis)
        .where("userId", "==", userId)
        .where("updatedAt", ">=", startOfDay)
        .where("updatedAt", "<=", endOfDay)
        .get();
    }

    return snapshot;
  };

  async getDataByRange(userId, jenis, startDate, endDate) {
    try {
      const snapshot = await this.db
        .collection(jenis)
        .where("userId", "==", userId)
        .where("updatedAt", ">=", startDate)
        .where("updatedAt", "<=", endDate)
        .get();
      return snapshot;
    } catch (error) {
      console.error("Error retrieving data by range:", error);
      throw new Error("Error retrieving data by range");
    }
  }
}

module.exports = new DashboardRepository();
