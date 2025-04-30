class BarangEntity {
    constructor({ namaBarang, jumlah, harga }) {
        this.namaBarang = namaBarang;
        this.jumlah = jumlah;
        this.harga = harga;
    }

    toJSON() {
        return {
            namaBarang: this.namaBarang,
            jumlah: this.jumlah,
            harga: this.harga,
        };
    }

    getFilledFields() {
        return {
            namaBarang: this.namaBarang,
            jumlah: this.jumlah,
            harga: this.harga
        };
    }
}

module.exports = BarangEntity;
