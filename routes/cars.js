const mongoose = require('mongoose');
const multer = require('multer');
const express = require('express');
const router = express.Router();
const Car = require('../models/car');

// Define valid file types
const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg',
};

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error('Invalid image type');

        if (isValid) {
            uploadError = null;
        }
        cb(uploadError, 'public/carsimg'); // Set the destination folder
    },
    filename: function (req, file, cb) {
        const fileName = file.originalname.split(' ').join('-');
        const extension = FILE_TYPE_MAP[file.mimetype];
        cb(null, `${fileName}-${Date.now()}.${extension}`); // Set the filename
    },
});

const uploadOptions = multer({ storage: storage });

// Create a new car
router.post('/', uploadOptions.single('image'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).send('No image in the request');
        }

        const { make, model, rental, isAvailable } = req.body;

        // Check if all required fields are provided
        if (!make || !model || !rental) {
            return res.status(400).send('Make, model, and rental are required');
        }

        const fileName = file.filename;
        const basePath = `${req.protocol}://${req.get('host')}/public/carsimg/`;

        // Parse 'isAvailable' to a boolean if it's passed as a string
        const available = isAvailable === 'true';

        // Create and save the car object
        let car = new Car({
            make,
            model,
            image: `${basePath}${fileName}`,
            rental,
            isAvailable: available, // Ensure it's a boolean
        });

        car = await car.save();
        if (!car) {
            return res.status(500).send("The car was not created");
        }

        res.status(201).json(car); // Resource successfully created
    } catch (err) {
        console.error('Error creating car:', err);
        res.status(500).send('Internal server error');
    }
});

// router.post('/', uploadOptions.single('image'), async (req, res) => {
//     try {
//         const file = req.file;
//         if (!file) {
//             return res.status(400).send('No image in the request');
//         }

//         const fileName = file.filename;
//         const basePath = `${req.protocol}://${req.get('host')}/public/carsimg/`;

//         let car = new Car({
//             make: req.body.make,
//             model: req.body.model,
//             image: `${basePath}${fileName}`,
//             rental: req.body.rental,
//             isAvailable: req.body.isAvailable
//         });

//         car = await car.save();
//         if (!car) return res.status(500).send("The car was not created");
//         res.status(201).json(car); // Use 201 for resource creation
//     } catch (err) {
//         console.error('Error creating car:', err);
//         res.status(500).send('Internal server error');
//     }
// });

// Update a car (Vendor only)
router.put('/:id', uploadOptions.single('image'), async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send('Invalid Car Id');
    }

    try {
        const car = await Car.findById(req.params.id);
        if (!car) return res.status(404).send('Car not found');

        const file = req.file;
        let imagePath = car.image;

        if (file) {
            const fileName = file.filename;
            const basePath = `${req.protocol}://${req.get('host')}/public/carsimg/`;
            imagePath = `${basePath}${fileName}`;
        }

        const updatedCar = await Car.findByIdAndUpdate(
            req.params.id,
            {
                make: req.body.make,
                model: req.body.model,
                image: imagePath,
                rental: req.body.rental,
                isAvailable: req.body.isAvailable
            },
            { new: true }
        );

        if (!updatedCar) return res.status(500).send('Car could not be updated');
        res.json(updatedCar);
    } catch (err) {
        console.error('Error updating car:', err);
        res.status(500).send('Internal server error');
    }
});

// Delete a car (Vendor only)
router.delete('/:id', async (req, res) => {
    try {
        const car = await Car.findByIdAndDelete(req.params.id);
        if (!car) return res.status(404).send('Car not found');
        res.status(204).send(); // Use 204 for successful deletion with no content
    } catch (err) {
        console.error('Error deleting car:', err);
        res.status(500).send('Internal server error');
    }
});

// Get all cars with their bookings
router.get('/', async (req, res) => {
  try {
      const cars = await Car.find().populate('bookings');
      res.json(cars);
  } catch (err) {
      console.error('Error retrieving cars:', err);
      res.status(500).send('Internal server error');
  }
});


// Get a specific car
router.get('/:id', async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);
        if (!car) return res.status(404).send('Car not found');
        res.json(car);
    } catch (err) {
        console.error('Error retrieving car:', err);
        res.status(500).send('Internal server error');
    }
});

module.exports = router;
