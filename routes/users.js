const  User  = require('../models/User');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendConfirmationEmail = require('../util/mailer'); // Import the email function
const crypto = require('crypto'); // For generating confirmation tokens

// Get all users
router.get('/', async (req, res) => {
  const userList = await User.find().select('-passwordHash');

  if (!userList) {
    return res.status(500).json({ success: false });
  }
  res.send(userList);
});

// Get a specific user by ID
router.get('/:id', async (req, res) => {
  const user = await User.findById(req.params.id).select('-passwordHash');

  if (!user) {
    return res.status(500).json({ message: 'The user with the given ID was not found.' });
  }
  res.status(200).send(user);
});

// Create a new user
router.post('/', async (req, res) => {
  let user = new User({
    name: req.body.name,
    address: req.body.address,
    email: req.body.email,
    passwordHash: bcrypt.hashSync(req.body.password, 10),
    phone: req.body.phone,
    licences: req.body.licences,
  });
  user = await user.save();

  if (!user) {
    return res.status(400).send('The user cannot be created!');
  }

  res.send(user);
});

// Update an existing user
router.put('/:id', async (req, res) => {
  const userExist = await User.findById(req.params.id);
  let newPassword;
  if (req.body.password) {
    newPassword = bcrypt.hashSync(req.body.password, 10);
  } else {
    newPassword = userExist.passwordHash;
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      address: req.body.address,
      email: req.body.email,
      passwordHash: newPassword,
      phone: req.body.phone,
      licences: req.body.licences,
    },
    { new: true }
  );

  if (!user) {
    return res.status(400).send('The user cannot be updated!');
  }

  res.send(user);
});

// User login
router.post('/login', async (req, res) => {
  try {
      const user = await User.findOne({ email: req.body.email });
      console.log('Fetched user:', user); // Debugging line

      if (!user) {
          console.log('User not found');
          return res.status(400).json({ message: 'User not found' });
      }

      const isPasswordValid = bcrypt.compareSync(req.body.password, user.passwordHash);
      if (!isPasswordValid) {
          console.log('Incorrect password');
          return res.status(400).json({ message: 'Incorrect password' });
      }

      const token = jwt.sign(
          { userId: user.id },
          process.env.SECRET,
          { expiresIn: '1d' }
      );

      // Check if the email is admin's and set role to 'admin' in the response if so
      const responseRole = user.email === 'admin@gmail.com' ? 'admin' : user.role;

      res.status(200).json({
          userId: user.id,
          email: user.email,
          token: token,
          role: responseRole // Adjusted role based on email
      });
      console.log('User logged in successfully');
  } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
  }
});


  
// User registration

router.post('/register', async (req, res) => {
  try {
    // Generate confirmation token
    const confirmationToken = crypto.randomBytes(32).toString('hex');

    // Create a new user
    let user = new User({
      name: req.body.name,
      address: req.body.address,
      email: req.body.email,
      passwordHash: bcrypt.hashSync(req.body.password, 10),
      phone: req.body.phone,
      licences: req.body.licences,
      confirmationToken: confirmationToken, // Save the token
      isConfirmed: false, // Default to false until email is confirmed
    });

    // Save the user to the database
    user = await user.save();

    if (!user) {
      return res.status(400).send('The user cannot be created!');
    }

    // Send confirmation email
    sendConfirmationEmail(user.email, confirmationToken);

    res.status(201).send({ message: 'User created successfully. Please check your email to confirm your registration.', user });
  } catch (error) {
    res.status(500).send('There was an error registering the user.');
  }
});


// Delete a user
router.delete('/:id', (req, res) => {
  User.findByIdAndRemove(req.params.id).then(user => {
    if (user) {
      return res.status(200).json({ success: true, message: 'The user is deleted!' });
    } else {
      return res.status(404).json({ success: false, message: 'User not found!' });
    }
  }).catch(err => {
    return res.status(500).json({ success: false, error: err });
  });
});

// Get user count
router.get('/get/count', async (req, res) => {
  const userCount = await User.countDocuments();

  if (!userCount) {
    res.status(500).json({ success: false });
  }
  res.send({
    userCount: userCount
  });
});

router.get('/confirm/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ confirmationToken: token });

    if (!user) {
      return res.status(400).send('Invalid token or user not found.');
    }

    user.isConfirmed = true;
    user.confirmationToken = null; // Clear the token after confirmation
    await user.save();

    res.status(200).send('Email confirmed successfully. You can now log in.');
  } catch (error) {
    res.status(500).send('There was an error confirming your email.');
  }
});


module.exports = router;
