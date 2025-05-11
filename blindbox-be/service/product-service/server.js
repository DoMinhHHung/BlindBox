const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

const app = express();
const PORT = process.env.PORT || 2004;

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.ATLAS_URL)
  .then(() => console.log("MongoDB connection established"))
  .catch((err) => console.log("MongoDB connection error:", err));

app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/reviews", reviewRoutes);

app.get("/", (req, res) => {
  res.send("Product Service API running");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
