const pengeluaranService = require("../service/PengeluaranService");
const { sendResponse } = require("../response");
const auth = require("../service/authService");

class PengeluaranController {
  async getPengeluaran(req, res) {
    try {
      const search = req.query.search ?? null;
      const kategori = req.query.kategori ?? null;
      const startDate = req.query.startDate ?? null;
      const endDate = req.query.endDate ?? null;
      const nominalMin = req.query.nominalMin ?? null;
      let nominalMax = req.query.nominalMax ?? null;
      const userId = await auth.getUserAuthenticate(req.user);
      if ( nominalMax == 0 ){
        nominalMax = null;
      }
      const result = await pengeluaranService.getPengeluaran(userId, search, kategori, startDate, endDate, nominalMin, nominalMax);

      if (!result) {
        return sendResponse(404, req.body, "Pengeluaran not found", res);
      }

      sendResponse(200, result, "Data successfully retrieved", res, true);
    } catch (error) {
      console.error(error);
      sendResponse(
        500,
        req.body,
        "Error retrieving pengeluaran: " + error.message,
        res
      );
    }
  }

  async getPengeluaranById(req, res) {
    try {
      const { id } = req.params;
      const userId = await auth.getUserAuthenticate(req.user);
      const result = await pengeluaranService.getPengeluaranById(id, userId);

      sendResponse(200, result, "Data successfully retrieved", res, true);
    } catch (error) {
      console.error(error);
      sendResponse(
        500,
        req.body,
        "Error retrieving pengeluaran: " + error.message,
        res
      );
    }
  }

  async addPengeluaran(req, res) {
    try {
      const userId = await auth.getUserAuthenticate(req.user);
      const result = await pengeluaranService.addPengeluaran(
        { ...req.body, isPengeluaran: true },
        userId
      );

      sendResponse(200, result, "Data successfully added", res, true);
    } catch (error) {
      sendResponse(
        500,
        req.body,
        "Error adding pengeluaran service: " + error.message,
        res
      );
    }
  }

  async updatePengeluaran(req, res) {
    try {
      const { id } = req.params;
      const result = await pengeluaranService.updatePengeluaran(
        id,
        req.body,
        req.user
      );

      sendResponse(200, result, "Data successfully updated", res, true);
    } catch (error) {
      sendResponse(
        500,
        req.body,
        "Error updating pengeluaran service: " + error.message,
        res
      );
    }
  }

  async deletePengeluaran(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return sendResponse(400, req.body, "Missing document ID", res);
      }

      const userId = await auth.getUserAuthenticate(req.user);
      const result = await pengeluaranService.deletePengeluaran(id, userId);

      if (!result) {
        return sendResponse(
          404,
          req.body,
          "Pengeluaran tidak ditemukan atau tidak diizinkan",
          res
        );
      }

      sendResponse(200, result, "Pengeluaran berhasil dihapus", res, true);
    } catch (error) {
      console.error(error);
      sendResponse(
        500,
        req.body,
        "Gagal menghapus pengeluaran: " + error.message,
        res
      );
    }
  }

  async addPengeluaranByGPT(req, res) {
    try {
      const result = await pengeluaranService.addPengeluaranByGPT(
        req.body,
        req.user
      );
      sendResponse(200, result, "Data successfully added", res, true);
    } catch (error) {
      sendResponse(
        500,
        req.body,
        "Error adding pengeluaran: " + error.message,
        res
      );
    }
  }
}

module.exports = new PengeluaranController();
