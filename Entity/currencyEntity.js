class CurrencyEntity {
  constructor({currency_code, locale, currency_symbol, country}) {
    this.currency_code = currency_code;
    this.locale = locale;
    this.currency_symbol = currency_symbol;
    this.country = country;
  }

    validateFields() {
        const missing = [];
        if (!this.currency_code) missing.push("currency_code");
        if (!this.locale) missing.push("locale");
        if (!this.currency_symbol) missing.push("currency_symbol");
        if (!this.country) missing.push("country");
        return missing;
    }

    getFilledFields() {
        const data = {};
        if (this.currency_code) data.currency_code = this.currency_code;
        if (this.locale) data.locale = this.locale;
        if (this.currency_symbol) data.currency_symbol = this.currency_symbol;
        return data;
    }

    hasAnyValue() {
        return Object.values(this.getFilledFields()).length > 0;
    }
}

module.exports = CurrencyEntity;