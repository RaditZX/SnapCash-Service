class KategoriEntity {
    constructor(id, nama, isPengeluaran) {
        this.id = id;
        this.nama = nama; 
        this.isPengeluaran = isPengeluaran ?? false;
    }

    validateForCreate() {
        const missing = [];
        if (!this.nama) missing.push("nama");
        if (typeof this.isPengeluaran !== 'boolean') {
            missing.push("isPengeluaran");
        }
        return missing;
    }

    validateForUpdate() {
        const missing = [];
        if (!this.id) missing.push("id");
        if (!this.nama) missing.push("nama");
        if (typeof this.isPengeluaran !== 'boolean') {
            missing.push("isPengeluaran");
        }
        return missing;
    }

    // Method lama untuk backward compatibility
    validateFields() {
        return this.validateForUpdate();
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

    // Method untuk mendapatkan data tanpa ID (untuk CREATE)
    getFilledFieldsForCreate() {
        const data = this.getFilledFields();
        delete data.id; // Hapus ID untuk operasi CREATE
        return data;
    }

    hasAnyValue() {
        return Object.values(this).some(value => value !== undefined && value !== null && value !== '');
    }
}

module.exports = KategoriEntity;