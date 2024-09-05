const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Payment = require('../models/payment'); // adjust the path as necessary
const Car = require('../models/Car'); // adjust the path as necessary
const Booking = require('../models/booking'); // adjust the path as necessary
const User = require('../models/User'); // adjust the path as necessary

// Create a new payment
router.post('/', async (req, res) => {
  try {
    const { bookingId, amount } = req.body;

    // Validate referenced models
    const bookingExists = await Booking.findById(bookingId);
    if (!bookingExists) return res.status(404).json({ message: 'Booking not found' });


    const payment = new Payment({
      bookingId,
      amount,
    });

    const savedPayment = await payment.save();
    res.status(201).json(savedPayment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all payments
router.get('/', async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('booking')
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a payment by ID
router.get('/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('booking')
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a payment by ID
router.put('/:id', async (req, res) => {
  try {
    const { booking, amount, paymentchannel } = req.body;


    const bookingExists = await Booking.findById(booking);
    if (!bookingExists) return res.status(404).json({ message: 'Booking not found' });

    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    payment.booking = booking;
    payment.amount = amount;
    payment.paymentchannel = paymentchannel;

    const updatedPayment = await payment.save();
    res.json(updatedPayment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a payment by ID
router.delete('/payments/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    await payment.remove();
    res.json({ message: 'Payment deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
