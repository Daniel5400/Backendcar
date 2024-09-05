const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
  car: { type: Schema.Types.ObjectId, ref: 'Car', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  price: { type: Number, required: true },
  user: { type: String, required: true },
});

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
