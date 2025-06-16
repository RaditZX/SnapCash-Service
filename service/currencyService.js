const currencyRepository = require("../repository/currencyRepository");
const currencyEntity = require("../Entity/currencyEntity");

class CurrencyService {
  constructor() {
    this.currencyRepository = currencyRepository;
    this.currencyEntity = currencyEntity;
  }
    async getCurrency(userId) {
        const result = await this.currencyRepository.getCurrency(userId);
        return result;
    }
    async getCurrencyById(id, userId) {
        const result = await this.currencyRepository.getCurrencyById(id, userId);
        return result;
    }
    async addCurrency(currencyData, userId) {
        const currency = new this.currencyEntity(currencyData);
        const missingFields = currency.validateFields();
        if (missingFields.length > 0) {
            throw new Error(`All fields are required. Missing: ${missingFields.join(", ")}`);
        }
        return await this.currencyRepository.addCurrency(currency.getFilledFields(), userId);
    }
    async updateCurrency(id, currencyData, userId) {
        const currency = new this.currencyEntity(currencyData);
        if (!currency.hasAnyValue()) {
            throw new Error("Minimal satu field harus diisi untuk melakukan update.");
        }
        return await this.currencyRepository.updateCurrency(id, currency.getFilledFields(), userId);
    }
    async deleteCurrency(id, userId) {
        return await this.currencyRepository.deleteCurrency(id, userId);
    }
}

module.exports = new CurrencyService();

  