const pemasukanRepository = require("../repository/pemasukanRepository");
const { sendResponse } = require("../response");
const auth = require("./authService");
const PemasukanEntity = require("../Entity/PemasukanEntity");

class PemasukanService {
  constructor() {
    this.pemasukanRepository = pemasukanRepository;
  }

  async getPemasukanUser(userId) {
    try {
      const result = await this.pemasukanRepository.getAllPemasukan(userId);
      return result;
    } catch (error) {
      throw new Error("Error retrieving pemasukan: " + error.message);
    }
  }

  async getPemasukanById(id, userId) {
    try {
      const result = await this.pemasukanRepository.getPemasukanById(id, userId);
      return result;
    } catch (error) {
      throw new Error("Error retrieving pemasukan by ID: " + error.message);
    }
  }

  async addPemasukan(pemasukanData, userId) {
    try {
      const pemasukan = new PemasukanEntity(pemasukanData);
      const missingFields = pemasukan.validateFields();
      if (missingFields.length > 0) {
        throw new Error(`All fields are required. Missing: ${missingFields.join(", ")}`);
      }
      const newPemasukan = await this.pemasukanRepository.createPemasukan(pemasukan, userId);
      return newPemasukan;
    } catch (error) {
      throw new Error("Error adding pemasukan: " + error.message);
    }
  }

  async updatePemasukan(id, updateData, userId) {
    try {
      const updatedPemasukan = await this.pemasukanRepository.updatePemasukan(id, updateData, userId);
      return updatedPemasukan;
    } catch (error) {
      throw new Error("Error updating pemasukan: " + error.message);
    }
  }

  async deletePemasukan(id, userId) {
    try {
      const deletedPemasukan = await this.pemasukanRepository.deletePemasukan(id, userId);
      return deletedPemasukan;
    } catch (error) {
      throw new Error("Error deleting pemasukan: " + error.message);
    }
  }

  async addPemasukanByGPT(pemasukanData, user) {
    try {
      const pemasukan = new PemasukanEntity(pemasukanData);
      const missingFields = pemasukan.validateFields();
      if (missingFields.length > 0) {
        throw new Error(`All fields are required. Missing: ${missingFields.join(", ")}`);
      }
      const userId = await auth.getUserAuthenticate(user);
      const newPemasukan = await this.pemasukanRepository.createPemasukan(pemasukan, userId);
      return newPemasukan;
    } catch (error) {
      throw new Error("Error adding pemasukan by GPT: " + error.message);
    }
  }
}

module.exports = new PemasukanService();
