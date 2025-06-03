const kategoriRepository = require('../repository/kategoriRepository');
const auth = require('./authService');
const KategoriEntity = require('../Entity/KategoriEntity');

class KategoriService {
  async getAllCategories(userId, search, isPengeluaran) {
    try {
        const categories = await kategoriRepository.getAllCategories(userId, search, isPengeluaran);
        return categories.map(cat => {
            const category = new KategoriEntity(cat.id, cat.nama, cat.isPengeluaran);
            category.userId = cat.userId;
            category.createdAt = cat.createdAt;
            category.updatedAt = cat.updatedAt;
            return category;
        });
    } catch (error) {
        console.error("Error in KategoriService.getAllCategories:", error.message, error.stack);
        throw new Error("Error fetching categories: " + error.message);
    }
  }

  async getCategoryById(id) {
    try {
      const category = await kategoriRepository.getCategoryById(id);
      return new KategoriEntity(category.id, category.nama, category.isPengeluaran);
    } catch (error) {
      throw new Error("Error fetching category: " + error.message);
    }
  }

  async addCategory(categoryData, userId) {
    // Untuk CREATE, ID akan null karena auto-generated
    const category = new KategoriEntity(null, categoryData.nama, categoryData.isPengeluaran);
    
    // Gunakan validasi khusus untuk CREATE
    const missingFields = category.validateForCreate();
    if (missingFields.length > 0) {
      throw new Error(`Missing fields: ${missingFields.join(', ')}`);
    }

    if (!category.hasAnyValue()) {
      throw new Error("No valid fields provided for the category.");
    }

    try {
      // Gunakan method khusus untuk CREATE yang tidak menyertakan ID
      const data = category.getFilledFieldsForCreate();
      return await kategoriRepository.addCategory(data, userId);
    } catch (error) {
      throw new Error("Error adding category: " + error.message);
    }
  }

  async updateCategory(id, categoryData, userId) {
    const category = new KategoriEntity(id, categoryData.nama, categoryData.isPengeluaran);
    
    // Untuk UPDATE, gunakan validasi dengan ID
    const missingFields = category.validateForUpdate();
    if (missingFields.length > 0) {
      throw new Error(`Missing fields: ${missingFields.join(', ')}`);
    }

    if (!category.hasAnyValue()) {
      throw new Error("No valid fields provided for the category.");
    }

    try {
      const data = category.getFilledFields();
      return await kategoriRepository.updateCategory(id, data, userId);
    } catch (error) {
      throw new Error("Error updating category: " + error.message);
    }
  }

  async deleteCategory(id, userId) {
    try {
      const result = await kategoriRepository.deleteCategory(id, userId);
      return result;
    } catch (error) {
      throw new Error("Error deleting category: " + error.message);
    }
  }
}

module.exports = new KategoriService();