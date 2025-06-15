const BarangEntity = require("./BarangEntity");
class PengeluaranEntity {
    constructor({
        namaPengeluaran,
        tanggal,
        toko,
        total,
        kategori,
        tambahanBiaya,
        barang,
        isPengeluaran
    }) {
        this.namaPengeluaran = namaPengeluaran;
        this.tanggal = tanggal;
        this.toko = toko;
        this.total = total;
        this.kategori = kategori;
        this.tambahanBiaya = tambahanBiaya;
        this.isPengeluaran = isPengeluaran;
        this.barang = Array.isArray(barang)
        ? barang.map(item => new BarangEntity(item))
        : [];
    }

    validateFields() {
        const missing = [];
        if (!this.namaPengeluaran) missing.push("namaPengeluaran");
        if (!this.tanggal) missing.push("tanggal");
        if (!this.toko) missing.push("toko");
        if (!this.total) missing.push("total");
        if (!this.isPengeluaran) {
            missing.push("isPengeluaran");
        }
        if ((!this.barang || this.barang.length === 0) && (!this.tambahanBiaya || this.tambahanBiaya.length === 0)) {
            missing.push("Item or Cost")
        }
        if (!this.kategori) {
            missing.push("kategori");
        }
        return missing;
    }

    getFilledFields() {
        const data = {};
        for (const key in this) {
            if (this[key] !== undefined && this[key] !== null && this[key] !== '') {
                if (key === 'barang' && Array.isArray(this[key])) {
                    // Convert each BarangEntity to plain object
                    data[key] = this[key].map(item =>
                        typeof item.getFilledFields === 'function'
                            ? item.getFilledFields()
                            : item
                    );
                } else {
                    data[key] = this[key];
                }
            }
        }
        return data;
    }
    
    hasAnyValue() {
        return Object.values(this).some(value => value !== undefined && value !== null && value !== '');
    }
}

module.exports = PengeluaranEntity;
