const{ sendResponse } = require("../response");
const kategoriService = require("../service/KategoriService");
const auth = require("../service/authService");

class KategoriController {
    async getAllCategories(req, res) {
        try {
        const userId = await auth.getUserAuthenticate(req.user);
        const search = req.query.search ?? null;
        const isPengeluaran = req.query.isPengeluaran === 'true' ? true : (req.query.isPengeluaran === 'false' ? false : null);
        
        const categories = await kategoriService.getAllCategories(userId, search, isPengeluaran);
        sendResponse(200, categories, "Categories successfully retrieved", res, true);
        } catch (error) {
        sendResponse(500, req.body, "Error retrieving categories: " + error.message, res);
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
        sendResponse(500, req.body, "Error adding category: " + error.message, res);
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
        sendResponse(500, req.body, "Error updating category: " + error.message, res);
        }
    }

    async deleteCategory(req, res) {
        try {
        const { id } = req.params;
        const userId = await auth.getUserAuthenticate(req.user);
        const result = await kategoriService.deleteCategory(id, userId);
        if (!result) {
            return sendResponse(404, req.body, "Category not found", res);
        }
        sendResponse(200, null,
            "Category successfully deleted", res, true);
        }
        catch (error) {
        sendResponse(500, req.body, "Error deleting category: " + error.message, res);
        }
    }
    
}
module.exports = new KategoriController();