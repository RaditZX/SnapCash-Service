const DashboardRepository = require("../repository/DashboardRepository");
const auth = require("./authService");
const { sendResponse } = require("../response");
const moment = require("moment");

class DashboardService {
    getDashboardData = async (req, res) => {
        try {
          const jenis = req.query.jenis || "Pemasukan";
          const filter = req.query.filter || "tahun";
          const tahun = parseInt(req.query.tahun) || new Date().getFullYear();
          const bulan = req.query.bulan ? parseInt(req.query.bulan) : undefined;
          const hari = req.query.hari ? parseInt(req.query.hari) : undefined;
      
          const user = req.user; // via middleware
          const userId = await auth.getUserAuthenticate(user);
      
          const snapshot = await DashboardRepository.getDataByJenisDanWaktu(
            userId, jenis, filter, tahun, bulan, hari
          );
      
          const dashboardData = await processSnapshot(snapshot, filter, tahun, bulan, hari, userId , jenis);
      
          return sendResponse(200, dashboardData, "Dashboard data retrieved successfully", res, true);
        } catch (error) {
          console.error("Error retrieving dashboard data:", error);
          return sendResponse(500, null, error.message, res);
        }
      };
}


// ===== Helper Functions =====
function getPeriodTotal(docData, docDate, filter, tahun, bulan, hari) {
    const total = docData.total || 0;
  
    if (filter === "tahun") {
      return {
        current: docDate.year() === tahun ? total : 0,
        previous: docDate.year() === tahun - 1 ? total : 0
      };
    }
  
    if (filter === "bulan") {
      return {
        current: docDate.year() === tahun && docDate.month() + 1 === bulan ? total : 0,
        previous: docDate.year() === tahun && docDate.month() + 1 === bulan - 1 ? total : 0
      };
    }
  
    if (filter === "hari") {
      const currentDay = moment(`${tahun}-${bulan}-${hari}`);
      const previousDay = currentDay.clone().subtract(1, 'day');
      return {
        current: docDate.isSame(currentDay, 'day') ? total : 0,
        previous: docDate.isSame(previousDay, 'day') ? total : 0
      };
    }
  
    return { current: 0, previous: 0 };
  }
  
  function calculatePercentageChange(current, previous) {
    if (previous !== 0) {
      return Math.round(((current - previous) / previous) * 100);
    } else {
      return current !== 0 ? 100 : 0;
    }
  }
  
  
  function calculateTotalChange(current, previous) {
    return current - previous;
  }
  
  function formatResult(filter, currentTotal, previousTotal, perubahanPersen, perubahanTotal, totalByKategori = {}, totalByRange = {}) {
    const key = `total${filter.charAt(0).toUpperCase() + filter.slice(1)}Sebelumnya`;
    return {
      total: currentTotal,
      [key]: previousTotal,
      perubahanPersentase: perubahanPersen,
      perubahanTotal: perubahanTotal,
      TotalByKategori: totalByKategori,
      TotalByRange: totalByRange,
    };
  }
  
  function getTotalPerKategori(snapshot, filter, tahun, bulan, hari) {
    const totalKategori = {};
  
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (!data.updatedAt || !data.kategori) return;
  
      const tanggal = moment(data.updatedAt.toDate());
  
      // Filter berdasarkan waktu
      const cocok =
        (filter === "tahun" && tanggal.year() === tahun) ||
        (filter === "bulan" && tanggal.year() === tahun && tanggal.month() + 1 === bulan) ||
        (filter === "hari" && tanggal.isSame(moment(`${tahun}-${bulan}-${hari}`), "day"));
  
      if (!cocok) return;
  
      const kategori = data.kategori;
      const total = data.total || 0;
  
      if (!totalKategori[kategori]) {
        totalKategori[kategori] = 0;
      }
  
      totalKategori[kategori] += total;
    });
  
    return totalKategori;
  }

  async function getTotalByRange(userId, jenis, filter, tahun, bulan, hari) {
    const totalPerPeriode = {};
  
    for (let i = 0; i < 5; i++) {
      let startDate, endDate, keyLabel;
  
      if (filter === "tahun") {
        const targetYear = tahun - i;
        startDate = moment().year(targetYear).startOf("year").toDate();
        endDate = moment().year(targetYear).endOf("year").toDate();
        keyLabel = targetYear.toString();
  
      } else if (filter === "bulan") {
        if (!bulan) continue;
        const targetYear = tahun - i;
        startDate = moment().year(targetYear).month(bulan - 1).startOf("month").toDate();
        endDate = moment().year(targetYear).month(bulan - 1).endOf("month").toDate();
        keyLabel = `${targetYear}-${String(bulan).padStart(2, "0")}`;
  
      } else if (filter === "hari") {
        if (!bulan || !hari) continue;
        const targetDate = moment(`${tahun}-${bulan}-${hari}`, "YYYY-M-D").subtract(i, "days");
        startDate = targetDate.clone().startOf("day").toDate();
        endDate = targetDate.clone().endOf("day").toDate();
        keyLabel = targetDate.format("YYYY-MM-DD");
  
      } else {
        throw new Error("Filter tidak dikenali: gunakan 'tahun', 'bulan', atau 'hari'");
      }
  
      const snapshot = await DashboardRepository.getDataByRange(
        userId, jenis, startDate, endDate
      );
  
      let total = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        total += data.total || 0;
      });
  
      totalPerPeriode[keyLabel] = total;
    }
  
    return totalPerPeriode;
  }
  
  
  
  async function processSnapshot(snapshot, filter, tahun, bulan, hari, userId, jenis) {
    // Ambil total berdasarkan range (tahun, bulan, atau hari)
    const TotalByRange = await getTotalByRange(userId, jenis, filter, tahun, bulan, hari);
  
    // Tentukan label current dan previous
    let currentLabel, previousLabel;
  
    if (filter === "tahun") {
      currentLabel = tahun.toString();
      previousLabel = (tahun - 1).toString();
  
    } else if (filter === "bulan") {
      currentLabel = `${tahun}-${String(bulan).padStart(2, "0")}`;
      previousLabel = `${tahun - 1}-${String(bulan).padStart(2, "0")}`;
  
    } else if (filter === "hari") {
      const currentDate = moment(`${tahun}-${bulan}-${hari}`, "YYYY-M-D");
      currentLabel = currentDate.format("YYYY-MM-DD");
      previousLabel = currentDate.clone().subtract(1, "day").format("YYYY-MM-DD");
  
    } else {
      throw new Error("Filter tidak valid. Gunakan 'tahun', 'bulan', atau 'hari'.");
    }
  
    // Ambil total dari hasil by range
    const totalCurrent = TotalByRange[currentLabel] || 0;
    const totalPrevious = TotalByRange[previousLabel] || 0;
  
    // Kalkulasi lainnya
    const perubahanPersen = calculatePercentageChange(totalCurrent, totalPrevious);
    const perubahanTotal = calculateTotalChange(totalCurrent, totalPrevious);
    const TotalByKategori = getTotalPerKategori(snapshot, filter, tahun, bulan, hari);
  
    return formatResult(
      filter,
      totalCurrent,
      totalPrevious,
      perubahanPersen,
      perubahanTotal,
      TotalByKategori,
      TotalByRange
    );
  }
  

module.exports = new DashboardService();
