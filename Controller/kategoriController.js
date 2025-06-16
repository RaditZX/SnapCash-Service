const{ sendResponse } = require("../response");
const kategoriService = require("../service/KategoriService");
const auth = require("../service/authService");

class KategoriController {
    async getAllCategories(req, res) {
        try {
        const userId = req.user.uid; // Sesuaikan dengan middleware
        const { search } = req.query;
        const isPengeluaran = req.query.isPengeluaran ?? 'null';
        const parsedIsPengeluaran = isPengeluaran === 'null';

        console.log("getAllCategories request:", { userId, search, parsedIsPengeluaran });

        const categories = await kategoriService.getAllCategories(userId, search, parsedIsPengeluaran);
        sendResponse(200, categories || [], "Categories successfully retrieved", res, true);
        } catch (error) {
        console.error("Error in KategoriController.getAllCategories:", error.message, error.stack);
        let errorMessage = "Error retrieving categories";
        if (error.message.includes("Gunakan Huruf")) {
            errorMessage = "Parameter pencarian tidak valid";
            sendResponse(400, [], errorMessage, res, false);
        } else if (error.message.includes("fetching categories")) {
            errorMessage = "Terjadi kesalahan saat mengambil data kategori";
            sendResponse(500, [], errorMessage, res, false);
        } else {
            sendResponse(500, [], errorMessage + ": " + error.message, res, false);
        }
        }
    }

    async getCategoryById(req, res) {
        try {
        const { id } = req.params;
        const category = await kategoriService.getCategoryById(id);
        if (!category) {
            return sendResponse(404, req.body, "Category not found", res);
        }
        sendResponse(200, category, "Category successfully retrieved", res, true);
        } catch (error) {
        sendResponse(500, req.body, "Error retrieving category: " + error.message, res);
        }
    } 

    async addCategory(req, res) {
        try {
            const userId = await auth.getUserAuthenticate(req.user);
            const newCategory = await kategoriService.addCategory(req.body, userId);
            sendResponse(201, newCategory, "Category successfully added", res, true);
        } catch (error) {
            if (error.message.includes("Kategori dengan nama")) {
                sendResponse(409, req.body, error.message, res, false); 
            } else {
                sendResponse(500, req.body, "Error adding category: " + error.message, res, false);
            }
        }
    }

    async updateCategory(req, res) {
        try {
        const { id } = req.params;
        const userId = await auth.getUserAuthenticate(req.user);
        const updatedCategory = await kategoriService.updateCategory(id, req.body, userId);
        if (!updatedCategory) {
            return sendResponse(404, req.body, "Category not found", res);
        }
        sendResponse(200, updatedCategory, "Category successfully updated", res, true);
        } catch (error) {
        if (error.message.includes("Kategori dengan nama")) {
                sendResponse(409, req.body, error.message, res, false);
            } else {
                sendResponse(500, req.body, "Error updating category: " + error.message, res, false);
            }
        }
    }

    async deleteCategory(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.uid;
            console.log("deleteCategory request:", { id, userId });

            const result = await kategoriService.deleteCategory(id, userId);
            if (!result) {
                return sendResponse(404, {}, "Category not found", res, false);
            }
            sendResponse(200, result, "Category successfully deleted", res, true);
        } catch (error) {
            console.error("Error in KategoriController.deleteCategory:", error.message, error.stack);
            sendResponse(500, {}, "Error deleting category: " + error.message, res, false);
        }
    }
    
}
module.exports = new KategoriController();