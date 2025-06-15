const kategoriRepository = require('../repository/kategoriRepository');
const AuthService = require('../service/authService');
const KategoriEntity = require('../Entity/KategoriEntity');

const KATEGORI_MESSAGES = {
  SUCCESS: {
    RETRIEVED: "Categories retrieved",
    RETRIEVED_BY_ID: "Category retrieved",
    CREATED: "Category created",
    UPDATED: "Category updated",
    DELETED: "Category deleted",
  },
  ERROR: {
    FETCH: "Failed to retrieve categories",
    FETCH_BY_ID: "Failed to retrieve category",
    CREATE: "Failed to create category",
    UPDATE: "Failed to update category",
    DELETE: "Failed to delete category",
    MISSING_FIELDS: "Missing required fields",
    NOT_FOUND: "Category not found",
    INVALID: "Invalid parameters",
    NO_FIELDS: "No fields to update",
    UNAUTHORIZED: "Unauthorized access",
    GENERAL: "Something went wrong",
  },
};

const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
};

class KategoriService {
  async getAllCategories(userId, search, isPengeluaran) {
    try {
      if (!userId) {
        return {
          status: STATUS_CODES.BAD_REQUEST,
          message: KATEGORI_MESSAGES.ERROR.INVALID,
          data: null,
        };
      }

      await AuthService.getUserData(userId); // Validate user exists

      const categories = await kategoriRepository.getAllCategories(userId, search, isPengeluaran);
      const formattedCategories = categories.map(cat => ({
        id: cat.id,
        nama: cat.nama,
        isPengeluaran: cat.isPengeluaran,
        userId: cat.userId,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
      }));

      return {
        status: STATUS_CODES.OK,
        message: KATEGORI_MESSAGES.SUCCESS.RETRIEVED,
        data: {
          records: formattedCategories,
          totalCount: formattedCategories.length,
          filters: { search, isPengeluaran },
        },
      };
    } catch (error) {
      console.error("Error retrieving categories:", error.message);
      return {
        status: STATUS_CODES.SERVER_ERROR,
        message: KATEGORI_MESSAGES.ERROR.FETCH,
        data: null,
      };
    }
  }

  async getCategoryById(id, userId) {
    try {
      if (!id || !userId) {
        return {
          status: STATUS_CODES.BAD_REQUEST,
          message: KATEGORI_MESSAGES.ERROR.INVALID,
          data: null,
        };
      }

      await AuthService.getUserData(userId); // Validate user exists

      const category = await kategoriRepository.getCategoryById(id);
      if (!category) {
        return {
          status: STATUS_CODES.NOT_FOUND,
          message: KATEGORI_MESSAGES.ERROR.NOT_FOUND,
          data: null,
        };
      }

      if (category.userId !== userId) {
        return {
          status: STATUS_CODES.UNAUTHORIZED,
          message: KATEGORI_MESSAGES.ERROR.UNAUTHORIZED,
          data: null,
        };
      }

      return {
        status: STATUS_CODES.OK,
        message: KATEGORI_MESSAGES.SUCCESS.RETRIEVED_BY_ID,
        data: {
          id: category.id,
          nama: category.nama,
          isPengeluaran: category.isPengeluaran,
          userId: category.userId,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt,
        },
      };
    } catch (error) {
      console.error("Error retrieving category:", error.message);
      return {
        status: STATUS_CODES.SERVER_ERROR,
        message: KATEGORI_MESSAGES.ERROR.FETCH_BY_ID,
        data: null,
      };
    }
  }

  async addCategory(categoryData, userId) {
    try {
      if (!userId || !categoryData || typeof categoryData !== 'object') {
        return {
          status: STATUS_CODES.BAD_REQUEST,
          message: KATEGORI_MESSAGES.ERROR.INVALID,
          data: null,
        };
      }

      await AuthService.getUserData(userId); // Validate user exists

      const category = new KategoriEntity(null, categoryData.nama, categoryData.isPengeluaran);
      const missingFields = category.validateForCreate();
      if (missingFields.length) {
        return {
          status: STATUS_CODES.BAD_REQUEST,
          message: `${KATEGORI_MESSAGES.ERROR.MISSING_FIELDS}: ${missingFields.join(", ")}`,
          data: null,
        };
      }

      const data = category.getFilledFieldsForCreate();
      const newCategory = await kategoriRepository.addCategory(data, userId);

      return {
        status: STATUS_CODES.CREATED,
        message: KATEGORI_MESSAGES.SUCCESS.CREATED,
        data: { id: newCategory.id || newCategory._id, ...data },
      };
    } catch (error) {
      console.error("Error creating category:", error.message);
      return {
        status: STATUS_CODES.SERVER_ERROR,
        message: KATEGORI_MESSAGES.ERROR.CREATE,
        data: null,
      };
    }
  }

  async updateCategory(id, categoryData, userId) {
    try {
      if (!id || !userId || !categoryData || typeof categoryData !== 'object' || !Object.keys(categoryData).length) {
        return {
          status: STATUS_CODES.BAD_REQUEST,
          message: KATEGORI_MESSAGES.ERROR.INVALID,
          data: null,
        };
      }

      await AuthService.getUserData(userId); // Validate user exists

      const category = await kategoriRepository.getCategoryById(id);
      if (!category) {
        return {
          status: STATUS_CODES.NOT_FOUND,
          message: KATEGORI_MESSAGES.ERROR.NOT_FOUND,
          data: null,
        };
      }

      if (category.userId !== userId) {
        return {
          status: STATUS_CODES.UNAUTHORIZED,
          message: KATEGORI_MESSAGES.ERROR.UNAUTHORIZED,
          data: null,
        };
      }

      const entity = new KategoriEntity(id, categoryData.nama, categoryData.isPengeluaran);
      const missingFields = entity.validateForUpdate();
      if (missingFields.length) {
        return {
          status: STATUS_CODES.BAD_REQUEST,
          message: `${KATEGORI_MESSAGES.ERROR.MISSING_FIELDS}: ${missingFields.join(", ")}`,
          data: null,
        };
      }

      const data = entity.getFilledFields();
      if (!Object.keys(data).length) {
        return {
          status: STATUS_CODES.BAD_REQUEST,
          message: KATEGORI_MESSAGES.ERROR.NO_FIELDS,
          data: null,
        };
      }

      const updatedCategory = await kategoriRepository.updateCategory(id, data, userId);
      if (!updatedCategory) {
        return {
          status: STATUS_CODES.NOT_FOUND,
          message: KATEGORI_MESSAGES.ERROR.NOT_FOUND,
          data: null,
        };
      }

      return {
        status: STATUS_CODES.OK,
        message: KATEGORI_MESSAGES.SUCCESS.UPDATED,
        data: { id, ...data },
      };
    } catch (error) {
      console.error("Error updating category:", error.message);
      return {
        status: STATUS_CODES.SERVER_ERROR,
        message: KATEGORI_MESSAGES.ERROR.UPDATE,
        data: null,
      };
    }
  }

  async deleteCategory(id, userId) {
    try {
      if (!id || !userId) {
        return {
          status: STATUS_CODES.BAD_REQUEST,
          message: KATEGORI_MESSAGES.ERROR.INVALID,
          data: null,
        };
      }

      await AuthService.getUserData(userId); // Validate user exists

      const category = await kategoriRepository.getCategoryById(id);
      if (!category) {
        return {
          status: STATUS_CODES.NOT_FOUND,
          message: KATEGORI_MESSAGES.ERROR.NOT_FOUND,
          data: null,
        };
      }

      if (category.userId !== userId) {
        return {
          status: STATUS_CODES.UNAUTHORIZED,
          message: KATEGORI_MESSAGES.ERROR.UNAUTHORIZED,
          data: null,
        };
      }

      await kategoriRepository.deleteCategory(id, userId);

      return {
        status: STATUS_CODES.OK,
        message: KATEGORI_MESSAGES.SUCCESS.DELETED,
        data: { id, deletedAt: new Date().toISOString() },
      };
    } catch (error) {
      console.error("Error deleting category:", error.message);
      return {
        status: STATUS_CODES.SERVER_ERROR,
        message: KATEGORI_MESSAGES.ERROR.DELETE,
        data: null,
      };
    }
  }
}

module.exports = new KategoriService();