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
          const bulan = req.query.bulan ? parseInt(req.query.bulan) : moment().month() + 1;

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
    
    getDashboardAdminData = async (req, res) => {
        try {
          const user = await auth.getUserData(req.user.uid);
          if (!user.data || !user.data.role || user.data.role !== "admin") {
            return {
              status: 403,
              message: "Access denied. You are not an admin.",
            };
          }

          const userRegistration = req.query.userRegistration || "hari";
          const userRegistrationStartDate = req.query.startDate
            ? new Date(req.query.startDate)
            : moment().subtract(6, "days").startOf("day").toDate();

          
          const userRegistrationEndDate = req.query.endDate
            ? new Date(req.query.endDate)
            : moment().endOf("day").toDate();

          const userRegistrationData = await DashboardRepository.getUserRegistrationDataCount({
            startDate: userRegistrationStartDate,
            endDate: userRegistrationEndDate,
            groupBy: mapGroup(userRegistration),
          });

          const jenis = req.query.jenis || "Pengeluaran";

          const totalEachKategori = await DashboardRepository.getTotalEachKategori(jenis);

          return sendResponse(200, {
            userRegistrationData,
            totalEachKategori,
          }, "Dashboard data retrieved successfully", res, true);

        } catch (error) {
          console.error("Error retrieving admin dashboard data:", error);
          return sendResponse(500, null, error.message, res);
        }
      };
}

  
  function calculatePercentageChange(current, previous) {
    if (previous !== 0) {
      return Math.round(((current - previous) / previous) * 100);
    } else {
      return current !== 0 ? 100 : 0;
    }
  }
  
  const mapGroup = (type) => {
    switch (type.toLowerCase()) {
      case "hari": return "day";
      case "bulan": return "month";
      case "tahun": return "year";
      default: return "day";
    }
  };
  
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
      if (!data.tanggal || !data.kategori) return;
  
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
        
        // Kurangi i bulan dari bulan sekarang di tahun yang sama
        const targetDate = moment(`${tahun}-${bulan}-01`, "YYYY-M-D").subtract(i, "months");
        startDate = targetDate.clone().startOf("month").toDate();
        endDate = targetDate.clone().endOf("month").toDate();
        keyLabel = targetDate.format("YYYY-MM");

      } else if (filter === "hari") {
        if (!bulan || !hari) continue;

        // Kurangi i hari dari tanggal yang diberikan di tahun & bulan yang sama
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
