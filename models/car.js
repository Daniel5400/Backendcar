const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const carSchema = new Schema({
  make: { type: String, required: true },
  model: { type: String, required: true },
  rental: { type: Number, required: true },
  image: { type: String },
  isAvailable: { type: Boolean, default: true },
  bookings: [
    {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
    },
  ],
});


const Car = mongoose.model('Car', carSchema);
module.exports = Car;

