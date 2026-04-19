// server.js - Entry point for GaDes fit
const app = require('./app');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 3000;

// Connect to database, then start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n✨ GaDes fit server running on port ${PORT}`);
    console.log(`👗 Classy. Modern. Comfy.\n`);
  });
}).catch(err => {
  console.error('⚠️ MongoDB connection failed:', err.message);
  console.log('📁 Using local storage fallback\n');
  
  // Still start server with local storage
  app.listen(PORT, () => {
    console.log(`✨ GaDes fit server running on port ${PORT} (local storage mode)`);
    console.log(`👗 Classy. Modern. Comfy.\n`);
  });
});