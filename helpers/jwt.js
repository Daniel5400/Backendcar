const expressJwt = require('express-jwt');

function authJwt() {
    const secret = process.env.SECRET;
    const api = process.env.API_URL;
    return expressJwt({
        secret,
        algorithms: ['HS256'],
        isRevoked: isRevoked
    }).unless({
        path: [
            // Publicly accessible paths
            {url: /\/public\/carimg(.*)/ , methods: ['GET', 'OPTIONS'] }, // Allows GET and OPTIONS methods for images
            {url: /\/api\/v1\/cars(.*)/ , methods: ['GET','POST','EDIT','PUT','DELETE'] }, // Allows only GET requests for cars (you might want to reconsider POST, EDIT, DELETE)
            {url: /\/api\/v1\/bookings(.*)/ , methods: ['GET','POST','EDIT','DELETE'] }, // Allows only GET requests for bookings (you might want to reconsider POST, EDIT, DELETE)
            {url: /\/api\/v1\/payments(.*)/, methods: ['GET','POST','EDIT','DELETE']}, // Allows GET, OPTIONS, and POST for payments
             {url: /\/api\/v1\/users(.*)/, methods: ['GET', 'EDIT', 'POST','DELETE']}, // Allows GET, OPTIONS, and POST for users (you might want to reconsider EDIT, DELETE)
            `${api}/users/login`, // Allows login
            `${api}/users/register`, // Allows registration
        ]
    });
}

async function isRevoked(req, payload, done) {
    if (!payload.isAdmin) {
        done(null, true);
    }
    done();
}

module.exports = authJwt;
