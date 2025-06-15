class PemasukanEntity {
    constructor({ namaPemasukan, tanggal, sumber, total, tambahanBiaya, isPengeluaran, kategori, subTotal }) {
        this.namaPemasukan = namaPemasukan;
        this.tanggal = tanggal;
        this.sumber = sumber;
        this.total = total;
        this.tambahanBiaya = tambahanBiaya;
        this.isPengeluaran = isPengeluaran ?? false;
        this.kategori = kategori;
        this.subTotal = subTotal;
    }

    validateFields() {
        const missing = [];
        if (!this.namaPemasukan) missing.push("namaPemasukan");
        if (!this.tanggal) missing.push("tanggal");
        if (!this.sumber) missing.push("sumber");
        if (!this.total) missing.push("total");
        if (!this.isPengeluaran) {
            missing.push("isPengeluaran");
        }
        if (!this.kategori) {
            missing.push("kategori");
        }
        if(!this.subTotal) {
            missing.push("subtotal");
        }
        return missing;
    }

    getFilledFields() {
        const data = {};
        for (const key in this) {
            if (this[key] !== undefined && this[key] !== null && this[key] !== '') {
                data[key] = this[key];
            }
        }
        return data;
    }

    hasAnyValue() {
        return Object.values(this).some(value => value !== undefined && value !== null && value !== '');
    }
}

module.exports = PemasukanEntity;
