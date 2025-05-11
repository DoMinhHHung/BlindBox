const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const cartRoutes = require('./routes/cartRoutes');

const app = express();
const PORT = process.env.PORT || 2002;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.ATLAS_URL)
  .then(() => console.log('MongoDB connection established'))
  .catch(err => console.log('MongoDB connection error:', err));

app.use('/api/cart', cartRoutes);

app.get('/', (req, res) => {
  res.send('Cart Service API running');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
