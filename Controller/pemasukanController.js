const { sendResponse } = require("../response");
const pemasukanService = require("../service/PemasukanService");
const auth = require("../service/authService");

class PemasukanController {
  async getPemasukanUser(req, res) {
    try {
      const userId = await auth.getUserAuthenticate(req.user);
      const search = req.query.search ?? null;
      const kategori = req.query.kategori ?? null;
      const startDate = req.query.startDate ?? null;     
      const endDate = req.query.endDate ?? null; 
      const nominalMin = req.query.nominalMin ?? null;
      let nominalMax = req.query.nominalMax ?? null;
      if ( nominalMax == 0 ){
        nominalMax = null;
      }

      const result = await pemasukanService.getPemasukanUser(userId, search, kategori, startDate, endDate, nominalMin, nominalMax);
      if (!result) {
        return sendResponse(404, req.body, "Pemasukan not found", res);
      }
      sendResponse(200, result, "Data successfully retrieved", res, true);
    } catch (error) {
      sendResponse(500, req.body, error.message, res);
    }
  }

  async getPemasukanById(req, res) {
    try {
      const { id } = req.params;
      const userId = await auth.getUserAuthenticate(req.user);
      const result = await pemasukanService.getPemasukanById(id, userId);

      if (result.userId !== userId) {
        return sendResponse(403, req.body, "Unauthorized access to this pemasukan", res);
      }

      if (!result) {
        return sendResponse(404, req.body, "Pemasukan not found", res);
      }
      sendResponse(200, result, "Data successfully retrieved", res, true);
    } catch (error) {
      sendResponse(500, req.body, error.message, res);
    }
  }

  async addPemasukan(req, res) {
    try {
      const userId = await auth.getUserAuthenticate(req.user);
      const newPemasukan = await pemasukanService.addPemasukan(req.body, userId);
      sendResponse(200, newPemasukan, "Income Data successfully added", res, true);
    } catch (error) {
      sendResponse(500, req.body, error.message, res);
    }
  }

  async updatePemasukan(req, res) {
    try {
      const { id } = req.params;
      const userId = await auth.getUserAuthenticate(req.user);
      const updateData = req.body;
      const updatedPemasukan = await pemasukanService.updatePemasukan(id, updateData, userId);
      sendResponse(200, updatedPemasukan, "Income Data successfully updated", res, true);
    } catch (error) {
      sendResponse(500, req.body, error.message, res);
    }
  }

  async deletePemasukan(req, res) {
    try {
      const { id } = req.params;
      const userId = await auth.getUserAuthenticate(req.user);
      const deletedPemasukan = await pemasukanService.deletePemasukan(id, userId);
      sendResponse(200, deletedPemasukan, "Income Data successfully deleted", res, true);
    } catch (error) {
      sendResponse(500, req.body, error.message, res);
    }
  }

  async addPemasukanByGPT(req, res) {
    try {
      const { user } = req;
      const newPemasukan = await pemasukanService.addPemasukanByGPT(req.body, user.uid);
      sendResponse(200, newPemasukan, "Data successfully added", res, true);
    } catch (error) {
      sendResponse(500, req.body, error.message, res);
    }
  }
}

module.exports = new PemasukanController();
