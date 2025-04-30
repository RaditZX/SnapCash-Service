class UserEntity {
    constructor({ userId, email, username, foto }) {
        this.userId = userId;
        this.email = email;
        this.username = username;
        this.foto = foto;
    }

    // Fungsi untuk validasi field yang harus ada
    validateFields() {
        const missing = [];
        if (!this.userId) missing.push("userId");
        if (!this.email) missing.push("email");

        return missing;
    }

    // Fungsi untuk mendapatkan data yang telah diisi (bukan null atau undefined)
    getFilledFields() {
        const data = {};
        for (const key in this) {
            if (this[key] !== undefined && this[key] !== null && this[key] !== '') {
                data[key] = this[key];
            }
        }
        return data;
    }

    // Fungsi untuk mengecek apakah ada setidaknya satu field yang terisi
    hasAnyValue() {
        return Object.values(this).some(value => value !== undefined && value !== null && value !== '');
    }
}
