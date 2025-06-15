const DashboardRepository = require("../repository/DashboardRepository");
const AuthService = require("../service/authService");
const moment = require("moment");

const MESSAGES = {
  SUCCESS: {
    DATA: "Dashboard data retrieved.",
    ADMIN_DATA: "Admin dashboard data retrieved.",
  },
  ERROR: {
    INVALID_FILTER: "Invalid filter. Use 'tahun', 'bulan', or 'hari'.",
    INVALID_JENIS: "Invalid jenis. Use 'Pemasukan' or 'Pengeluaran'.",
    INVALID_DATE: "Invalid date or range.",
    ACCESS_DENIED: "Admin access required.",
    UNAUTHORIZED: "Please sign in.",
    FETCH_FAILED: "Failed to fetch data.",
    INVALID_PARAMS: "Invalid parameters.",
  },
};

const STATUS_CODES = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  SERVER_ERROR: 500,
};

const VALID_FILTERS = ["tahun", "bulan", "hari"];
const VALID_JENIS = ["Pemasukan", "Pengeluaran"];
const VALID_REGISTRATION_PERIODS = ["hari", "bulan", "tahun"];

class DashboardService {
  validateParams(jenis, filter, tahun, bulan, hari) {
    if (!VALID_JENIS.includes(jenis)) return `Invalid jenis: ${jenis}`;
    if (!VALID_FILTERS.includes(filter)) return `Invalid filter: ${filter}`;
    if (isNaN(tahun) || tahun < 1900 || tahun > 2100) return "Invalid year.";
    if (filter === "bulan" && (isNaN(bulan) || bulan < 1 || bulan > 12)) return "Invalid month.";
    if (filter === "hari") {
      if (isNaN(bulan) || bulan < 1 || bulan > 12 || isNaN(hari) || hari < 1 || hari > 31) return "Invalid day or month.";
      if (!moment(`${tahun}-${bulan}-${hari}`, "YYYY-M-D").isValid()) return "Invalid date.";
    }
    return null;
  }

  async getDashboardData(req, res) {
    try {
      const { jenis = "Pemasukan", filter = "tahun", tahun = new Date().getFullYear(), bulan = moment().month() + 1, hari } = req.query;
      const validationError = this.validateParams(jenis, filter, parseInt(tahun), parseInt(bulan), parseInt(hari));
      if (validationError) return sendResponse(STATUS_CODES.BAD_REQUEST, null, `${MESSAGES.ERROR.INVALID_PARAMS}: ${validationError}`, res);

      const user = req.user;
      if (!user?.uid) return sendResponse(STATUS_CODES.UNAUTHORIZED, null, MESSAGES.ERROR.UNAUTHORIZED, res);

      const snapshot = await DashboardRepository.getDataByJenisDanWaktu(user.uid, jenis, filter, parseInt(tahun), parseInt(bulan), parseInt(hari));
      if (!snapshot) return sendResponse(STATUS_CODES.SERVER_ERROR, null, MESSAGES.ERROR.FETCH_FAILED, res);

      const dashboardData = await this.processSnapshot(snapshot, filter, parseInt(tahun), parseInt(bulan), parseInt(hari), user.uid, jenis);

      const responseData = {
        summary: dashboardData.summary,
        breakdown: dashboardData.breakdown,
        metadata: {
          jenis,
          filter,
          tahun,
          bulan: filter !== "tahun" ? bulan : undefined,
          hari: filter === "hari" ? hari : undefined,
          generatedAt: new Date().toISOString(),
        },
      };

      return sendResponse(STATUS_CODES.OK, responseData, MESSAGES.SUCCESS.DATA, res, true);
    } catch (error) {
      console.error("Dashboard data error:", error);
      return sendResponse(STATUS_CODES.SERVER_ERROR, null, MESSAGES.ERROR.FETCH_FAILED, res);
    }
  }

  async getDashboardAdminData(req, res) {
    try {
      const user = req.user;
      if (!user?.uid) return sendResponse(STATUS_CODES.UNAUTHORIZED, null, MESSAGES.ERROR.UNAUTHORIZED, res);

      const userData = await AuthService.getUserData(user.uid);
      if (userData.status !== STATUS_CODES.OK || userData.data.role !== "admin")
        return sendResponse(STATUS_CODES.FORBIDDEN, null, MESSAGES.ERROR.ACCESS_DENIED, res);

      const { userRegistration = "hari", startDate, endDate, jenis = "Pemasukan" } = req.query;
      if (!VALID_REGISTRATION_PERIODS.includes(userRegistration))
        return sendResponse(STATUS_CODES.BAD_REQUEST, null, `Invalid period: ${userRegistration}`, res);
      if (!VALID_JENIS.includes(jenis)) return sendResponse(STATUS_CODES.BAD_REQUEST, null, MESSAGES.ERROR.INVALID_JENIS, res);

      let start = startDate ? moment(startDate).toDate() : moment().subtract(6, "days").startOf("day").toDate();
      let end = endDate ? moment(endDate).toDate() : moment().endOf("day").toDate();

      if (!moment(start).isValid() || !moment(end).isValid() || start >= end || moment(end).isAfter(moment().add(1, "year")))
        return sendResponse(STATUS_CODES.BAD_REQUEST, null, MESSAGES.ERROR.INVALID_DATE, res);

      const [userRegistrationData, totalEachKategori] = await Promise.all([
        DashboardRepository.getUserRegistrationDataCount({ startDate: start, endDate: end, groupBy: mapGroup(userRegistration) }),
        DashboardRepository.getTotalEachKategori({ jenis }),
      ]);

      const responseData = {
        userRegistrationData: {
          data: userRegistrationData || [],
          period: userRegistration,
          dateRange: { startDate: start.toISOString(), endDate: end.toISOString() },
        },
        totalEachKategori: { data: totalEachKategori || [], jenis },
        metadata: { generatedAt: new Date().toISOString(), requestedBy: user.uid },
      };

      return sendResponse(STATUS_CODES.OK, responseData, MESSAGES.SUCCESS.ADMIN_DATA, res, true);
    } catch (error) {
      console.error("Admin dashboard error:", error);
      return sendResponse(STATUS_CODES.SERVER_ERROR, null, MESSAGES.ERROR.FETCH_FAILED, res);
    }
  }

  async processSnapshot(snapshot, filter, tahun, bulan, hari, userId, jenis) {
    const totalByRange = await this.getTotalByRange(userId, jenis, filter, tahun, bulan, hari);
    let currentLabel, previousLabel;

    if (filter === "tahun") {
      currentLabel = tahun.toString();
      previousLabel = (tahun - 1).toString();
    } else if (filter === "bulan") {
      currentLabel = `${tahun}-${String(bulan).padStart(2, "0")}`;
      previousLabel = moment(`${tahun}-${bulan}-01`, "YYYY-M-D").subtract(1, "month").format("YYYY-MM");
    } else {
      currentLabel = moment(`${tahun}-${bulan}-${hari}`, "YYYY-M-D").format("YYYY-MM-DD");
      previousLabel = moment(`${tahun}-${bulan}-${hari}`, "YYYY-M-D").subtract(1, "day").format("YYYY-MM-DD");
    }

    const totalCurrent = totalByRange[currentLabel] || 0;
    const totalPrevious = totalByRange[previousLabel] || 0;
    const perubahanPersen = this.calculatePercentageChange(totalCurrent, totalPrevious);
    const perubahanTotal = totalCurrent - totalPrevious;
    const totalByKategori = this.getTotalPerKategori(snapshot);

    return {
      summary: {
        total: totalCurrent,
        [`total${filter.charAt(0).toUpperCase() + filter.slice(1)}Sebelumnya`]: totalPrevious,
        perubahanPersentase: perubahanPersen,
        perubahanTotal,
        trend: perubahanPersen > 0 ? "increasing" : perubahanPersen < 0 ? "decreasing" : "stable",
      },
      breakdown: { totalByKategori, totalByRange },
    };
  }

  calculatePercentageChange(current, previous) {
    return previous === 0 ? (current > 0 ? 100 : 0) : Math.round(((current - previous) / previous) * 100);
  }

  getTotalPerKategori(snapshot) {
    const totalKategori = {};
    if (!snapshot?.forEach) return totalKategori;

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.kategori && !isNaN(data.total)) {
        totalKategori[data.kategori] = (totalKategori[data.kategori] || 0) + Number(data.total);
      }
    });

    return totalKategori;
  }

  async getTotalByRange(userId, jenis, filter, tahun, bulan, hari) {
    const totalPerPeriode = {};
    for (let i = 0; i < 5; i++) {
      let startDate, endDate, keyLabel;

      if (filter === "tahun") {
        const targetYear = tahun - i;
        startDate = moment().year(targetYear).startOf("year").toDate();
        endDate = moment().year(targetYear).endOf("year").toDate();
        keyLabel = targetYear.toString();
      } else if (filter === "bulan") {
        const targetDate = moment(`${tahun}-${bulan}-01`, "YYYY-M-D").subtract(i, "months");
        startDate = targetDate.startOf("month").toDate();
        endDate = targetDate.endOf("month").toDate();
        keyLabel = targetDate.format("YYYY-MM");
      } else {
        const targetDate = moment(`${tahun}-${bulan}-${hari}`, "YYYY-M-D").subtract(i, "days");
        startDate = targetDate.startOf("day").toDate();
        endDate = targetDate.endOf("day").toDate();
        keyLabel = targetDate.format("YYYY-MM-DD");
      }

      const snapshot = await DashboardRepository.getDataByRange(userId, jenis, startDate, endDate);
      let total = 0;
      snapshot?.forEach((doc) => {
        total += Number(doc.data().total) || 0;
      });

      totalPerPeriode[keyLabel] = total;
    }
    return totalPerPeriode;
  }
}

const mapGroup = (type) => ({ hari: "day", bulan: "month", tahun: "year" }[type.toLowerCase()] || "day");

const sendResponse = (status, data, message, res, success = false) => {
  res.status(status).json({ success, data, message });
};

module.exports = new DashboardService();