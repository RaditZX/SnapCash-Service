const kategoriService = require("../service/KategoriService");
const { sendResponse } = require("../response");
const auth = require("../service/authService");

class KategoriController {
    async getAllKategori(req, res) {
        try {
            const userId = await auth.getUserAuthenticate(req.user);
            const result = await kategoriService.getAllKategori(userId);

            if (!result || result.length === 0) {
                return sendResponse(404, req.body, "No categories found", res);
            }

            sendResponse(200, result, "Categories successfully retrieved", res, true);
        } catch (error) {
            console.error(error);
            sendResponse(500, req.body, "Error retrieving categories: " + error.message, res);
        }
    }

    async getKategoriById(req, res) {
        try {
            const { id } = req.params;
            const userId = await auth.getUserAuthenticate(req.user);
            const result = await kategoriService.getKategoriById(id, userId);

            sendResponse(200, result, "Category successfully retrieved", res, true);
        } catch (error) {
            console.error(error);
            sendResponse(500, req.body, "Error retrieving category: " + error.message, res);
        }
    }

    async addKategori(req, res) {
        try {
            const userId = await auth.getUserAuthenticate(req.user);
            const result = await kategoriService.addKategori(req.body, userId);

            sendResponse(200, result, "Category successfully added", res, true);
        } catch (error) {
            sendResponse(500, req.body, "Error adding category: " + error.message, res);
        }
    }

    async updateKategori(req, res) {
        try {
            const { id } = req.params;
            const userId = await auth.getUserAuthenticate(req.user);
            const result = await kategoriService.updateKategori(id, req.body, userId);

            sendResponse(200, result, "Category successfully updated", res, true);
        } catch (error) {
            sendResponse(500, req.body, "Error updating category: " + error.message, res);
        }
    }

    async deleteKategori(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return sendResponse(400, req.body, "Missing category ID", res);
            }

            const userId = await auth.getUserAuthenticate(req.user);
            const result = await kategoriService.deleteKategori(id, userId);

            if (!result) {
                return sendResponse(404, req.body, "Category not found or unauthorized", res);
            }

            sendResponse(200, result, "Category successfully deleted", res, true);
        } catch (error) {
            console.error(error);
            sendResponse(500, req.body, "Error deleting category: " + error.message, res);
        }
    }
}

module.exports = new KategoriController();