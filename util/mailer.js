const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: 'SOGvehiclesltd@outlook.com', // your email address
        pass: '4332108Ca$', // your email password
    },
});

const sendConfirmationEmail = (userEmail, confirmationToken) => {
    const mailOptions = {
        from: "SOGvehiclesltd@outlook.com",
        to: userEmail,
        subject: 'Confirm your registration',
        html: `
            <h2>Welcome to Our App!</h2>
            <p>Please confirm your email by clicking on the link below:</p>
            <a href="https://yourdomain.com/confirm/${confirmationToken}">Confirm Email</a>
        `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
};

module.exports = sendConfirmationEmail;
