const app = require('./app');
const { PORT } = require('./config'); // Import the port

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
