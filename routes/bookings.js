const express = require('express');
    const router = express.Router();
    const Booking = require('../models/booking');
    const Car = require('../models/car');
    const User = require('../models/user');
    
    // Helper function to check if a car is available for the requested date range
    const isCarAvailable = async (carId, startDate, endDate) => {
      const car = await Car.findById(carId);
      if (!car) {
        throw new Error('Car not found');
      }
    
      // Check if any existing booking overlaps with the requested date range
      const isOverlapping = car.bookings.some(booking =>
        (new Date(startDate) <= new Date(booking.endDate) && new Date(endDate) >= new Date(booking.startDate))
      );
    
      // The car is considered available if no overlapping bookings exist
      return !isOverlapping;
    };
    
    // Create a new booking
    router.post('/', async (req, res) => {
      console.log('Received request:', req.body); // Add this line

      try {
        const { carId, startDate, endDate, price, userEmail } = req.body;
    
        if (!carId || !startDate || !endDate || !price || !userEmail) {
          return res.status(400).send('Missing required fields');
        }
    
        // Check if the car is available
        const available = await isCarAvailable(carId, startDate, endDate);
        if (!available) {
          return res.status(406).send('Car is not available for the specified date range');
        }
    
        // Find the user by email
        const user = await User.findOne({ email: userEmail });
        if (!user) {
          return res.status(404).send('User not found');
        }
    
        // Create the booking
        const booking = new Booking({ car: carId, startDate, endDate, price, user: user._id });
        const car = await Car.findById(carId);
    
        // Add the new booking to the car's bookings array
        car.bookings.push({ startDate: new Date(startDate), endDate: new Date(endDate) });
        
        // Save the updated car and new booking
        await car.save();
        await booking.save();
    
        res.status(201).json({ bookingId: booking._id, message: 'Booking successful!' });
      } catch (err) {
        console.error('Error creating booking:', err);
        res.status(500).send('Internal server error');
      }
    });
    
    // Get all bookings
    router.get('/', async (req, res) => {
      try {
        // Fetch bookings and populate the car details
        const bookings = await Booking.find().populate('car');
    
        // Process each booking to extract user details
        const bookingsWithUserDetails = await Promise.all(bookings.map(async (booking) => {
          let user = null;
          try {
            if (typeof booking.user === 'string') {
              // If user is an ID, fetch the user details from the database
              if (booking.user.match(/^[0-9a-fA-F]{24}$/)) { // Check if it's a valid ObjectId
                user = await User.findById(booking.user);
              } else {
                // If the user ID is invalid or not an ObjectId, log the issue
                console.error(`Invalid user ID: ${booking.user}`);
              }
            } else if (typeof booking.user === 'object') {
              // If user is already an object, extract required fields
              user = {
                name: booking.user.name,
                email: booking.user.email,
                phone: booking.user.phone
              };
            }
          } catch (err) {
            console.error('Error retrieving user data:', err);
          }
    
          // Return booking with extracted user details
          return {
            ...booking.toObject(),
            user: user ? {
              name: user.name,
              email: user.email,
              phone: user.phone
            } : null // Handle case where user data might not be available
          };
        }));
    
        res.json(bookingsWithUserDetails);
      } catch (err) {
        console.error('Error retrieving bookings:', err);
        res.status(500).send('Internal server error');
      }
    });
    
    
    // Get a single booking by ID
    router.get('/:id', async (req, res) => {
      try {
        const booking = await Booking.findById(req.params.id).populate('car');
        if (!booking) {
          return res.status(404).send('Booking not found');
        }
        res.json(booking);
      } catch (err) {
        console.error('Error retrieving booking:', err);
        res.status(500).send('Internal server error');
      }
    });
    
    // Update a booking by ID
    router.put('/:id', async (req, res) => {
      try {
        const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!booking) {
          return res.status(404).send('Booking not found');
        }
        res.json(booking);
      } catch (err) {
        console.error('Error updating booking:', err);
        res.status(500).send('Internal server error');
      }
    });
    
    // Delete a booking by ID
    router.delete('/:id', async (req, res) => {
      try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
          return res.status(404).send('Booking not found');
        }
    
        // Find the associated car and update its bookings array
        const car = await Car.findById(booking.car);
        if (car) {
          // Remove the deleted booking from the car's bookings array
          car.bookings = car.bookings.filter(b =>
            !(b.startDate.getTime() === booking.startDate.getTime() &&
              b.endDate.getTime() === booking.endDate.getTime())
          );
          
          await car.save();
        }
    
        await Booking.findByIdAndDelete(req.params.id);
        res.status(204).send();
      } catch (err) {
        console.error('Error deleting booking:', err);
        res.status(500).send('Internal server error');
      }
    });
    
    module.exports = router;
    
