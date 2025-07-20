//Singleton burada kullanılıyor. tek bir instance oluşturuluyor. ve her zaman aynı instance kullanılıyor. bu yüzden birden fazla bağlantı yapılmasını engelliyor.

let instance = null;
var mongoose = require("mongoose");

class Database {
  constructor() {
    if (!instance) {
      this.mongoConnection = null;
      this.instance = this;
    }
    return instance;
  }

  async connect(options) {
    try {
      let db = await mongoose.connect(options.CONNECTION_STRING);
      this.mongoConnection = db;
      console.log("Connected to MongoDB");
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = Database;
