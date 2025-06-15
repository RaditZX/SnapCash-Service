const pemasukanRepository = require("../repository/pemasukanRepository");
const AuthService = require("../service/authService");
const PemasukanEntity = require("../Entity/PemasukanEntity");

const PEMASUKAN_MESSAGES = {
  SUCCESS: {
    RETRIEVED: "Income data retrieved successfully",
    RETRIEVED_BY_ID: "Income record retrieved successfully",
    CREATED: "Income record created successfully",
    UPDATED: "Income record updated successfully",
    DELETED: "Income record deleted successfully",
    CREATED_BY_AI: "Income record created by AI successfully",
  },
  ERROR: {
    FETCH_ERROR: "Failed to retrieve income data",
    FETCH_BY_ID_ERROR: "Failed to retrieve income record",
    CREATE_ERROR: "Failed to create income record",
    UPDATE_ERROR: "Failed to update income record",
    DELETE_ERROR: "Failed to delete income record",
    AI_CREATE_ERROR: "Failed to create income record via AI",
    INVALID_DATE_FORMAT: "Invalid date format provided",
    INVALID_AMOUNT: "Invalid amount value provided",
    MISSING_FIELDS: "Required fields are missing",
    RECORD_NOT_FOUND: "Income record not found",
    UNAUTHORIZED: "You don't have permission to access this record",
    INVALID_PARAMETERS: "Invalid parameters provided",
    DATE_PARSE_ERROR: "Unable to parse the provided date",
    TIMESTAMP_CONVERSION_ERROR: "Unable to convert timestamp to readable format",
  },
};

const STATUS_CODES = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
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
    if (!dateString || typeof dateString !== 'string') {
      throw new Error("Date string is required and must be a string");
    }

    const regex = /(\d{1,2})\s+(\w+)\s+(\d{4}),\s+(\d{2}:\d{2}:\d{2})/;
    const match = dateString.trim().match(regex);

    if (!match) {
      throw new Error(`Date format should be "DD MonthName YYYY, HH:mm:ss". Received: ${dateString}`);
    }

    const [, day, monthText, year, time] = match;
    const month = MONTH_MAP[monthText];

    if (!month) {
      const validMonths = Object.keys(MONTH_MAP).join(", ");
      throw new Error(`Invalid month name "${monthText}". Valid months: ${validMonths}`);
    }

    const dayNum = parseInt(day);
    const yearNum = parseInt(year);

    if (dayNum < 1 || dayNum > 31) {
      throw new Error(`Invalid day: ${day}. Must be between 1-31`);
    }

    if (yearNum < 1900 || yearNum > 2100) {
      throw new Error(`Invalid year: ${year}. Must be between 1900-2100`);
    }

    const formatted = `${year}-${month}-${day.padStart(2, "0")}T${time}`;
    const parsedDate = new Date(formatted);

    if (isNaN(parsedDate.getTime())) {
      throw new Error(`Invalid date created: ${formatted}`);
    }

    return parsedDate;
  } catch (error) {
    console.error("Date parsing error:", error);
    throw new Error(`${PEMASUKAN_MESSAGES.ERROR.DATE_PARSE_ERROR}: ${error.message}`);
  }
}

function formatIndoDateFromTimestamp(timestamp) {
  try {
    if (!timestamp) {
      throw new Error("Timestamp is required");
    }

    let dateObj;
    if (typeof timestamp.toDate === 'function') {
      dateObj = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      dateObj = timestamp;
    } else if (typeof timestamp === 'number') {
      dateObj = new Date(timestamp);
    } else if (typeof timestamp === 'string') {
      dateObj = new Date(timestamp);
    } else {
      throw new Error("Unsupported timestamp format");
    }

    if (isNaN(dateObj.getTime())) {
      throw new Error("Invalid timestamp value");
    }

    const day = dateObj.getDate().toString().padStart(2, "0");
    const month = MONTH_NAMES[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    const hours = dateObj.getHours().toString().padStart(2, "0");
    const minutes = dateObj.getMinutes().toString().padStart(2, "0");
    const seconds = dateObj.getSeconds().toString().padStart(2, "0");

    return `${day} ${month} ${year}, ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error("Timestamp formatting error:", error);
    throw new Error(`${PEMASUKAN_MESSAGES.ERROR.TIMESTAMP_CONVERSION_ERROR}: ${error.message}`);
  }
}

function validateAmount(amount) {
  if (amount === null || amount === undefined) return true;

  const num = Number(amount);
  if (isNaN(num)) {
    throw new Error("Amount must be a valid number");
  }

  if (num < 0) {
    throw new Error("Amount cannot be negative");
  }

  if (num > 999999999999) {
    throw new Error("Amount is too large");
  }

  return true;
}

function validateDateRange(startDate, endDate) {
  if (startDate && endDate && startDate > endDate) {
    throw new Error("Start date cannot be later than end date");
  }
  return true;
}

function sanitizeSearchQuery(search) {
  if (!search) return null;
  return search.toString().trim().substring(0, 100);
}

class PemasukanService {
  constructor() {
    this.pemasukanRepository = pemasukanRepository;
  }

  async getPemasukanUser(userId, search, kategori, startDate, endDate, nominalMin, nominalMax) {
    try {
      if (!userId) {
        return {
          status: STATUS_CODES.BAD_REQUEST,
          message: PEMASUKAN_MESSAGES.ERROR.INVALID_PARAMETERS,
          data: null,
        };
      }

      const sanitizedSearch = sanitizeSearchQuery(search);

      let min = null, max = null;
      if (nominalMin !== undefined && nominalMin !== null && nominalMin !== '') {
        validateAmount(nominalMin);
        min = Number(nominalMin);
      }
      if (nominalMax !== undefined && nominalMax !== null && nominalMax !== '') {
        validateAmount(nominalMax);
        max = Number(nominalMax);
      }

      if (min !== null && max !== null && min > max) {
        return {
          status: STATUS_CODES.BAD_REQUEST,
          message: "Minimum amount cannot be greater than maximum amount",
          data: null,
        };
      }

      let start = null, end = null;
      if (startDate) {
        start = parseIndoDate(startDate);
      }
      if (endDate) {
        end = parseIndoDate(endDate);
      }
      validateDateRange(start, end);

      const result = await this.pemasukanRepository.getAllPemasukan(
        userId, sanitizedSearch, kategori, start, end, min, max
      );

      const formattedResult = result.map(item => {
        try {
          if (item.tanggal) {
            item.tanggal = formatIndoDateFromTimestamp(item.tanggal);
          }
          return item;
        } catch (dateError) {
          console.error("Date formatting error for item:", item.id, dateError);
          return item;
        }
      });

      return {
        status: STATUS_CODES.SUCCESS,
        message: PEMASUKAN_MESSAGES.SUCCESS.RETRIEVED,
        data: {
          records: formattedResult,
          totalCount: formattedResult.length,
          filters: {
            search: sanitizedSearch,
            kategori,
            dateRange: start && end ? { start: startDate, end: endDate } : null,
            amountRange: min !== null || max !== null ? { min, max } : null,
          },
        },
      };
    } catch (error) {
      console.error("Error retrieving pemasukan:", error);
      return {
        status: STATUS_CODES.INTERNAL_ERROR,
        message: PEMASUKAN_MESSAGES.ERROR.FETCH_ERROR,
        details: error.message,
        data: null,
      };
    }
  }

  async getPemasukanById(id, userId) {
    try {
      if (!id || !userId) {
        return {
          status: STATUS_CODES.BAD_REQUEST,
          message: PEMASUKAN_MESSAGES.ERROR.INVALID_PARAMETERS,
          data: null,
        };
      }

      const result = await this.pemasukanRepository.getPemasukanById(id, userId);
      if (!result) {
        return {
          status: STATUS_CODES.NOT_FOUND,
          message: PEMASUKAN_MESSAGES.ERROR.RECORD_NOT_FOUND,
          data: null,
        };
      }

      if (result.tanggal) {
        result.tanggal = formatIndoDateFromTimestamp(result.tanggal);
      }

      return {
        status: STATUS_CODES.SUCCESS,
        message: PEMASUKAN_MESSAGES.SUCCESS.RETRIEVED_BY_ID,
        data: result,
      };
    } catch (error) {
      console.error("Error retrieving pemasukan by ID:", error);
      if (error.message.includes("not found") || error.message.includes("does not exist")) {
        return {
          status: STATUS_CODES.NOT_FOUND,
          message: PEMASUKAN_MESSAGES.ERROR.RECORD_NOT_FOUND,
          data: null,
        };
      }
      return {
        status: STATUS_CODES.INTERNAL_ERROR,
        message: PEMASUKAN_MESSAGES.ERROR.FETCH_BY_ID_ERROR,
        details: error.message,
        data: null,
      };
    }
  }

  async addPemasukan(pemasukanData, userId) {
    try {
      if (!userId) {
        return {
          status: STATUS_CODES.BAD_REQUEST,
          message: PEMASUKAN_MESSAGES.ERROR.INVALID_PARAMETERS,
          data: null,
        };
      }

      if (!pemasukanData || typeof pemasukanData !== 'object') {
        return {
          status: STATUS_CODES.BAD_REQUEST,
          message: "Income data is required and must be an object",
          data: null,
        };
      }

      if (pemasukanData.tanggal) {
        pemasukanData.tanggal = parseIndoDate(pemasukanData.tanggal);
      }

      if (pemasukanData.total !== undefined) {
        validateAmount(pemasukanData.total);
      }

      console.log("Processing pemasukan data:", { ...pemasukanData, tanggal: pemasukanData.tanggal?.toISOString() });

      const pemasukan = new PemasukanEntity(pemasukanData);
      const missingFields = pemasukan.validateFields();
      if (missingFields.length > 0) {
        return {
          status: STATUS_CODES.BAD_REQUEST,
          message: `${PEMASUKAN_MESSAGES.ERROR.MISSING_FIELDS}: ${missingFields.join(", ")}`,
          data: null,
        };
      }

      const newPemasukan = await this.pemasukanRepository.createPemasukan(pemasukan, userId);

      return {
        status: STATUS_CODES.CREATED,
        message: PEMASUKAN_MESSAGES.SUCCESS.CREATED,
        data: {
          id: newPemasukan.id || newPemasukan._id,
          ...pemasukanData,
          tanggal: pemasukanData.tanggal ? formatIndoDateFromTimestamp(pemasukanData.tanggal) : null,
        },
      };
    } catch (error) {
      console.error("Error adding pemasukan:", error);
      return {
        status: STATUS_CODES.INTERNAL_ERROR,
        message: PEMASUKAN_MESSAGES.ERROR.CREATE_ERROR,
        details: error.message,
        data: null,
      };
    }
  }

  async updatePemasukan(id, updateData, userId) {
    try {
      if (!id || !userId) {
        return {
          status: STATUS_CODES.BAD_REQUEST,
          message: PEMASUKAN_MESSAGES.ERROR.INVALID_PARAMETERS,
          data: null,
        };
      }

      if (!updateData || typeof updateData !== 'object' || Object.keys(updateData).length === 0) {
        return {
          status: STATUS_CODES.BAD_REQUEST,
          message: "Update data is required and must contain at least one field",
          data: null,
        };
      }

      if (updateData.tanggal) {
        updateData.tanggal = parseIndoDate(updateData.tanggal);
      }

      if (updateData.total !== undefined) {
        validateAmount(updateData.total);
      }

      const updatedPemasukan = await this.pemasukanRepository.updatePemasukan(id, updateData, userId);
      if (!updatedPemasukan) {
        return {
          status: STATUS_CODES.NOT_FOUND,
          message: PEMASUKAN_MESSAGES.ERROR.RECORD_NOT_FOUND,
          data: null,
        };
      }

      return {
        status: STATUS_CODES.SUCCESS,
        message: PEMASUKAN_MESSAGES.SUCCESS.UPDATED,
        data: {
          id,
          updatedFields: Object.keys(updateData),
          ...updateData,
          tanggal: updateData.tanggal ? formatIndoDateFromTimestamp(updateData.tanggal) : undefined,
        },
      };
    } catch (error) {
      console.error("Error updating pemasukan:", error);
      if (error.message.includes("not found") || error.message.includes("does not exist")) {
        return {
          status: STATUS_CODES.NOT_FOUND,
          message: PEMASUKAN_MESSAGES.ERROR.RECORD_NOT_FOUND,
          data: null,
        };
      }
      return {
        status: STATUS_CODES.INTERNAL_ERROR,
        message: PEMASUKAN_MESSAGES.ERROR.UPDATE_ERROR,
        details: error.message,
        data: null,
      };
    }
  }

  async deletePemasukan(id, userId) {
    try {
      if (!id || !userId) {
        return {
          status: STATUS_CODES.BAD_REQUEST,
          message: PEMASUKAN_MESSAGES.ERROR.INVALID_PARAMETERS,
          data: null,
        };
      }

      const deletedPemasukan = await this.pemasukanRepository.deletePemasukan(id, userId);
      if (!deletedPemasukan) {
        return {
          status: STATUS_CODES.NOT_FOUND,
          message: PEMASUKAN_MESSAGES.ERROR.RECORD_NOT_FOUND,
          data: null,
        };
      }

      return {
        status: STATUS_CODES.SUCCESS,
        message: PEMASUKAN_MESSAGES.SUCCESS.DELETED,
        data: {
          id,
          deletedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error("Error deleting pemasukan:", error);
      if (error.message.includes("not found") || error.message.includes("does not exist")) {
        return {
          status: STATUS_CODES.NOT_FOUND,
          message: PEMASUKAN_MESSAGES.ERROR.RECORD_NOT_FOUND,
          data: null,
        };
      }
      return {
        status: STATUS_CODES.INTERNAL_ERROR,
        message: PEMASUKAN_MESSAGES.ERROR.DELETE_ERROR,
        details: error.message,
        data: null,
      };
    }
  }

  async addPemasukanByGPT(pemasukanData, user) {
    try {
      if (!user?.uid) {
        return {
          status: STATUS_CODES.UNAUTHORIZED,
          message: PEMASUKAN_MESSAGES.ERROR.UNAUTHORIZED,
          data: null,
        };
      }

      if (!pemasukanData || typeof pemasukanData !== 'object') {
        return {
          status: STATUS_CODES.BAD_REQUEST,
          message: "AI-generated income data is required and must be an object",
          data: null,
        };
      }

      if (pemasukanData.tanggal) {
        pemasukanData.tanggal = parseIndoDate(pemasukanData.tanggal);
      }

      if (pemasukanData.total !== undefined) {
        validateAmount(pemasukanData.total);
      }

      const pemasukan = new PemasukanEntity(pemasukanData);
      const missingFields = pemasukan.validateFields();
      if (missingFields.length > 0) {
        return {
          status: STATUS_CODES.BAD_REQUEST,
          message: `${PEMASUKAN_MESSAGES.ERROR.MISSING_FIELDS}: ${missingFields.join(", ")}`,
          data: null,
        };
      }

      const userId = user.uid;
      const newPemasukan = await this.pemasukanRepository.createPemasukan(pemasukan, userId);

      return {
        status: STATUS_CODES.CREATED,
        message: PEMASUKAN_MESSAGES.SUCCESS.CREATED_BY_AI,
        data: {
          id: newPemasukan.id || newPemasukan._id,
          source: "AI_GENERATED",
          ...pemasukanData,
          tanggal: pemasukanData.tanggal ? formatIndoDateFromTimestamp(pemasukanData.tanggal) : null,
        },
      };
    } catch (error) {
      console.error("Error adding pemasukan by AI:", error);
      return {
        status: STATUS_CODES.INTERNAL_ERROR,
        message: PEMASUKAN_MESSAGES.ERROR.AI_CREATE_ERROR,
        details: error.message,
        data: null,
      };
    }
  }
}

module.exports = new PemasukanService();