const PengeluaranRepository = require("../repository/pengeluaranRepository");
const PengeluaranEntity = require("../Entity/PengeluaranEntity");
const AuthService = require("../service/authService");

const PENGELUARAN_MESSAGES = {
  SUCCESS: {
    RETRIEVED: "Outcome retrieved",
    RETRIEVED_BY_ID: "Expense retrieved",
    CREATED: "Expense created",
    UPDATED: "Expense updated",
    DELETED: "Expense deleted",
    CREATED_BY_AI: "Expense created by AI",
  },
  ERROR: {
    FETCH: "Failed to retrieve outcome",
    FETCH_BY_ID: "Failed to retrieve expense",
    CREATE: "Failed to create expense",
    UPDATE: "Failed to update expense",
    DELETE: "Failed to delete expense",
    AI_CREATE: "Failed to create expense via AI",
    INVALID_DATE: "Invalid date format",
    INVALID_AMOUNT: "Invalid amount",
    MISSING_FIELDS: "Missing required fields",
    NOT_FOUND: "Expense not found",
    UNAUTHORIZED: "Unauthorized access",
    INVALID: "Invalid parameters",
    GENERAL: "Something went wrong",
  },
};

const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
};

const MONTH_MAP = {
  Januari: "01", Februari: "02", Maret: "03", April: "04",
  Mei: "05", Juni: "06", Juli: "07", Agustus: "08",
  September: "09", Oktober: "10", November: "11", Desember: "12",
};

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function parseIndoDate(dateString) {
  try {
    if (!dateString || typeof dateString !== "string") {
      throw new Error("Date string required");
    }

    const regex = /(\d{1,2})\s+(\w+)\s+(\d{4}),\s+(\d{2}:\d{2}:\d{2})/;
    const match = dateString.trim().match(regex);
    if (!match) {
      throw new Error("Invalid date format. Use 'DD MonthName YYYY, HH:mm:ss'");
    }

    const [, day, monthText, year, time] = match;
    const month = MONTH_MAP[monthText];
    if (!month) {
      throw new Error(`Invalid month: ${monthText}`);
    }

    const dayNum = parseInt(day);
    if (dayNum < 1 || dayNum > 31) {
      throw new Error("Invalid day");
    }

    const yearNum = parseInt(year);
    if (yearNum < 1900 || yearNum > 2100) {
      throw new Error("Invalid year");
    }

    const formatted = `${year}-${month}-${day.padStart(2, "0")}T${time}`;
    const parsedDate = new Date(formatted);
    if (isNaN(parsedDate.getTime())) {
      throw new Error("Invalid date");
    }

    return parsedDate;
  } catch (error) {
    throw new Error(PENGELUARAN_MESSAGES.ERROR.INVALID_DATE);
  }
}

function formatIndoDateFromTimestamp(timestamp) {
  try {
    let dateObj;
    if (typeof timestamp.toDate === "function") {
      dateObj = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      dateObj = timestamp;
    } else {
      dateObj = new Date(timestamp);
    }

    if (isNaN(dateObj.getTime())) {
      throw new Error("Invalid timestamp");
    }

    const day = dateObj.getDate().toString().padStart(2, "0");
    const month = MONTH_NAMES[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    const hours = dateObj.getHours().toString().padStart(2, "0");
    const minutes = dateObj.getMinutes().toString().padStart(2, "0");
    const seconds = dateObj.getSeconds().toString().padStart(2, "0");

    return `${day} ${month} ${year}, ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    throw new Error(PENGELUARAN_MESSAGES.ERROR.INVALID_DATE);
  }
}

function validateAmount(amount) {
  if (amount == null) return true;

  const num = Number(amount);
  if (isNaN(num) || num < 0 || num > 999999999999) {
    throw new Error(PENGELUARAN_MESSAGES.ERROR.INVALID_AMOUNT);
  }
  return true;
}

function validateDateRange(startDate, endDate) {
  if (startDate && endDate && startDate > endDate) {
    throw new Error("Start date cannot be later than end date");
  }
}

function sanitizeSearchQuery(search) {
  return search ? search.toString().trim().substring(0, 100) : null;
}

class PengeluaranService {
  constructor() {
    this.pengeluaranRepository = PengeluaranRepository;
  }

  async getPengeluaran(userId, search, kategori, startDate, endDate, nominalMin, nominalMax) {
    try {
      if (!userId) {
        return {
          status: STATUS_CODES.BAD_REQUEST,
          message: PENGELUARAN_MESSAGES.ERROR.INVALID,
          data: null,
        };
      }

      await AuthService.getUserData(userId); // Validate user

      const sanitizedSearch = sanitizeSearchQuery(search);
      let min = nominalMin ? Number(nominalMin) : null;
      let max = nominalMax ? Number(nominalMax) : null;

      if (min != null) validateAmount(min);
      if (max != null) validateAmount(max);
      if (min != null && max != null && min > max) {
        return {
          status: STATUS_CODES.BAD_REQUEST,
          message: "Minimum amount cannot exceed maximum",
          data: null,
        };
      }

      let start = startDate ? parseIndoDate(startDate) : null;
      let end = endDate ? parseIndoDate(endDate) : null;
      validateDateRange(start, end);

      const result = await this.pengeluaranRepository.getAllPengeluaran(
        userId, sanitizedSearch, kategori, start, end, min, max
      );

      const formattedResult = result.map(item => ({
        ...item,
        tanggal: item.tanggal ? formatIndoDateFromTimestamp(item.tanggal) : null,
      }));

      return {
        status: STATUS_CODES.OK,
        message: PENGELUARAN_MESSAGES.SUCCESS.RETRIEVED,
        data: {
          records: formattedResult,
          totalCount: formattedResult.length,
          filters: { search: sanitizedSearch, kategori, dateRange: start && end ? { start: startDate, end: endDate } : null, amountRange: min != null || max != null ? { min, max } : null },
        },
      };
    } catch (error) {
      console.error("Error retrieving outcome:", error.message);
      return {
        status: STATUS_CODES.SERVER_ERROR,
        message: PENGELUARAN_MESSAGES.ERROR.FETCH,
        data: null,
      };
    }
  }

  async getPengeluaranById(id, userId) {
    try {
      if (!id || !userId) {
        return {
          status: STATUS_CODES.BAD_REQUEST,
          message: PENGELUARAN_MESSAGES.ERROR.INVALID,
          data: null,
        };
      }

      await AuthService.getUserData(userId); // Validate user

      const result = await this.pengeluaranRepository.getPengeluaranById(id, userId);
      if (!result) {
        return {
          status: STATUS_CODES.NOT_FOUND,
          message: PENGELUARAN_MESSAGES.ERROR.NOT_FOUND,
          data: null,
        };
      }

      if (result.userId !== userId) {
        return {
          status: STATUS_CODES.UNAUTHORIZED,
          message: PENGELUARAN_MESSAGES.ERROR.UNAUTHORIZED,
          data: null,
        };
      }

      return {
        status: STATUS_CODES.OK,
        message: PENGELUARAN_MESSAGES.SUCCESS.RETRIEVED_BY_ID,
        data: {
          ...result,
          tanggal: result.tanggal ? formatIndoDateFromTimestamp(result.tanggal) : null,
        },
      };
    } catch (error) {
      console.error("Error retrieving expense:", error.message);
      return {
        status: STATUS_CODES.SERVER_ERROR,
        message: PENGELUARAN_MESSAGES.ERROR.FETCH_BY_ID,
        data: null,
      };
    }
  }

  async addPengeluaran(pengeluaranData, userId) {
    try {
      if (!userId || !pengeluaranData || typeof pengeluaranData !== "object") {
        return {
          status: STATUS_CODES.BAD_REQUEST,
          message: PENGELUARAN_MESSAGES.ERROR.INVALID,
          data: null,
        };
      }

      await AuthService.getUserData(userId); // Validate user

      if (pengeluaranData.tanggal) {
        pengeluaranData.tanggal = parseIndoDate(pengeluaranData.tanggal);
      }
      if (pengeluaranData.total != null) {
        validateAmount(pengeluaranData.total);
      }

      const pengeluaran = new PengeluaranEntity(pengeluaranData);
      const missingFields = pengeluaran.validateFields();
      if (missingFields.length) {
        return {
          status: STATUS_CODES.BAD_REQUEST,
          message: `${PENGELUARAN_MESSAGES.ERROR.MISSING_FIELDS}: ${missingFields.join(", ")}`,
          data: null,
        };
      }

      const newPengeluaran = await this.pengeluaranRepository.addPengeluaran(pengeluaran.getFilledFields(), userId);

      return {
        status: STATUS_CODES.CREATED,
        message: PENGELUARAN_MESSAGES.SUCCESS.CREATED,
        data: {
          id: newPengeluaran.id || newPengeluaran._id,
          ...pengeluaranData,
          tanggal: pengeluaranData.tanggal ? formatIndoDateFromTimestamp(pengeluaranData.tanggal) : null,
        },
      };
    } catch (error) {
      console.error("Error adding expense:", error.message);
      return {
        status: STATUS_CODES.SERVER_ERROR,
        message: PENGELUARAN_MESSAGES.ERROR.CREATE,
        data: null,
      };
    }
  }

  async updatePengeluaran(id, updateData, userId) {
    try {
      if (!id || !userId || !updateData || typeof updateData !== "object" || !Object.keys(updateData).length) {
        return {
          status: STATUS_CODES.BAD_REQUEST,
          message: PENGELUARAN_MESSAGES.ERROR.INVALID,
          data: null,
        };
      }

      await AuthService.getUserData(userId); // Validate user

      if (updateData.tanggal) {
        updateData.tanggal = parseIndoDate(updateData.tanggal);
      }
      if (updateData.total != null) {
        validateAmount(updateData.total);
      }

      const pengeluaran = new PengeluaranEntity(updateData);
      const data = pengeluaran.getFilledFields();
      if (!Object.keys(data).length) {
        return {
          status: STATUS_CODES.BAD_REQUEST,
          message: PENGELUARAN_MESSAGES.ERROR.INVALID,
          data: null,
        };
      }

      const updatedPengeluaran = await this.pengeluaranRepository.updatePengeluaran(id, data, userId);
      if (!updatedPengeluaran) {
        return {
          status: STATUS_CODES.NOT_FOUND,
          message: PENGELUARAN_MESSAGES.ERROR.NOT_FOUND,
          data: null,
        };
      }

      return {
        status: STATUS_CODES.OK,
        message: PENGELUARAN_MESSAGES.SUCCESS.UPDATED,
        data: { id, ...data, tanggal: updateData.tanggal ? formatIndoDateFromTimestamp(updateData.tanggal) : undefined },
      };
    } catch (error) {
      console.error("Error updating expense:", error.message);
      return {
        status: STATUS_CODES.SERVER_ERROR,
        message: PENGELUARAN_MESSAGES.ERROR.UPDATE,
        data: null,
      };
    }
  }

  async deletePengeluaran(id, userId) {
    try {
      if (!id || !userId) {
        return {
          status: STATUS_CODES.BAD_REQUEST,
          message: PENGELUARAN_MESSAGES.ERROR.INVALID,
          data: null,
        };
      }

      await AuthService.getUserData(userId); // Validate user

      const deletedPengeluaran = await this.pengeluaranRepository.deletePengeluaran(id, userId);
      if (!deletedPengeluaran) {
        return {
          status: STATUS_CODES.NOT_FOUND,
          message: PENGELUARAN_MESSAGES.ERROR.NOT_FOUND,
          data: null,
        };
      }

      return {
        status: STATUS_CODES.OK,
        message: PENGELUARAN_MESSAGES.SUCCESS.DELETED,
        data: { id, deletedAt: new Date().toISOString() },
      };
    } catch (error) {
      console.error("Error deleting expense:", error.message);
      return {
        status: STATUS_CODES.SERVER_ERROR,
        message: PENGELUARAN_MESSAGES.ERROR.DELETE,
        data: null,
      };
    }
  }

  async addPengeluaranByGPT(pengeluaranData, user) {
    try {
      if (!user?.uid || !pengeluaranData || typeof pengeluaranData !== "object") {
        return {
          status: STATUS_CODES.BAD_REQUEST,
          message: PENGELUARAN_MESSAGES.ERROR.INVALID,
          data: null,
        };
      }

      await AuthService.getUserData(user.uid); // Validate user

      if (pengeluaranData.tanggal) {
        pengeluaranData.tanggal = parseIndoDate(pengeluaranData.tanggal);
      }
      if (pengeluaranData.total != null) {
        validateAmount(pengeluaranData.total);
      }

      const pengeluaran = new PengeluaranEntity(pengeluaranData);
      const missingFields = pengeluaran.validateFields();
      if (missingFields.length) {
        return {
          status: STATUS_CODES.BAD_REQUEST,
          message: `${PENGELUARAN_MESSAGES.ERROR.MISSING_FIELDS}: ${missingFields.join(", ")}`,
          data: null,
        };
      }

      const newPengeluaran = await this.pengeluaranRepository.addPengeluaran(pengeluaran.getFilledFields(), user.uid);

      return {
        status: STATUS_CODES.CREATED,
        message: PENGELUARAN_MESSAGES.SUCCESS.CREATED_BY_AI,
        data: {
          id: newPengeluaran.id || newPengeluaran._id,
          source: "AI_GENERATED",
          ...pengeluaranData,
          tanggal: pengeluaranData.tanggal ? formatIndoDateFromTimestamp(pengeluaranData.tanggal) : null,
        },
      };
    } catch (error) {
      console.error("Error adding AI expense:", error.message);
      return {
        status: STATUS_CODES.SERVER_ERROR,
        message: PENGELUARAN_MESSAGES.ERROR.AI_CREATE,
        data: null,
      };
    }
  }
}

module.exports = new PengeluaranService();