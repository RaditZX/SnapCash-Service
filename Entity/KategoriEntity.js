class KategoriEntity {
    constructor({ namaKategori, isPengeluaran }) {
        this.namaKategori = namaKategori;
        this.isPengeluaran = isPengeluaran;
    }

    validateFields() {
        const missing = [];
        if (this.namaKategori === undefined || this.namaKategori === null || this.namaKategori.trim() === "") {
            missing.push("namaKategori");
        }
        if (this.isPengeluaran === undefined || this.isPengeluaran === null) {
            missing.push("isPengeluaran");
        }
        return missing;
    }

    getFilledFields() {
        const data = {};
        if (this.namaKategori !== undefined && this.namaKategori !== null && this.namaKategori.trim() !== "") {
            data.namaKategori = this.namaKategori;
        }
        if (this.isPengeluaran !== undefined && this.isPengeluaran !== null) {
            data.isPengeluaran = this.isPengeluaran;
        }
        return data;
    }

    hasAnyValue() {
        return Object.values(this.getFilledFields()).length > 0;
    }
}

module.exports = KategoriEntity;