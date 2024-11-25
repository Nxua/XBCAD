import jwt from 'jsonwebtoken';

// Replace with your secret key
const JWT_SECRET = 'your-very-secure-secret';

// Define the payload for the token
const payload = {
  id: '1234567890',      // Replace with user ID or other identifying information
  name: 'Luke Sowray',   // Replace with user name
  email: 'lukesowray1@gmail.com', // Replace with user email
  role: 'employee',      // Add any custom roles or claims as needed
};

// Define token options (optional)
const options = {
  expiresIn: '1h', // Token expiration time (1 hour in this case)
};

// Generate the token
const token = jwt.sign(payload, JWT_SECRET, options);

console.log('Generated JWT Token:');
console.log(token);
