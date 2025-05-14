const currencyServices = require("../service/currencyService");
const { sendResponse } = require("../response");
const auth = require("../service/authService");

class CurrencyController {
  constructor() {
    this.currencyService = currencyServices;

    // Arrow functions to preserve `this`
    this.getCurrency = async (req, res) => {
      try {
        const userId = await auth.getUserAuthenticate(req.user);
        const result = await this.currencyService.getCurrency(userId);

        if (!result) {
          return sendResponse(404, req.body, "Currency not found", res);
        }
        sendResponse(200, result, "Data successfully retrieved", res, true);
      } catch (error) {
        sendResponse(500, req.body, "Error retrieving currency: " + error.message, res);
      }
    };

    this.getCurrencyById = async (req, res) => {
      try {
        const { id } = req.params;
        const userId = await auth.getUserAuthenticate(req.user);
        const result = await this.currencyService.getCurrencyById(id, userId);

        if (!result) {
          return sendResponse(404, req.body, "Currency not found", res);
        }
        sendResponse(200, result, "Data successfully retrieved", res, true);
      } catch (error) {
        sendResponse(500, req.body, "Error retrieving currency: " + error.message, res);
      }
    };

    this.addCurrency = async (req, res) => {
      try {
        const userId = await auth.getUserAuthenticate(req.user);
        const newCurrency = await this.currencyService.addCurrency(req.body, userId);
        sendResponse(200, newCurrency, "Data successfully added", res, true);
      } catch (error) {
        console.error(error);
        sendResponse(500, req.body, "Error adding currency: " + error.message, res);
      }
    };

    this.updateCurrency = async (req, res) => {
      try {
        const { id } = req.params;
        const userId = await auth.getUserAuthenticate(req.user);
        const updatedCurrency = await this.currencyService.updateCurrency(id, req.body, userId);
        sendResponse(200, updatedCurrency, "Data successfully updated", res, true);
      } catch (error) {
        sendResponse(500, req.body, "Error updating currency: " + error.message, res);
      }
    };

    this.deleteCurrency = async (req, res) => {
      try {
        const { id } = req.params;
        const userId = await auth.getUserAuthenticate(req.user);
        const deletedCurrency = await this.currencyService.deleteCurrency(id, userId);
        sendResponse(200, deletedCurrency, "Currency successfully deleted", res, true);
      } catch (error) {
        sendResponse(500, req.body, "Error deleting currency: " + error.message, res);
      }
    };
  }
}

module.exports = new CurrencyController();
