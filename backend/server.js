const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Crop = require("./models/Crop");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  console.log("Root route hit");
  res.send("FarmConnect API running");
});

/* MongoDB Connection */

mongoose.connect(
  "mongodb+srv://farmconnect:farmconnect123@farmer.g56zocs.mongodb.net/farmconnect"
)
.then(() => console.log("MongoDB Connected"))
.catch((err) => console.log(err));

/* Add Crop */

app.post("/addCrop", async (req, res) => {

  try {

    console.log("Incoming crop data:", req.body);

    const newCrop = new Crop({
      cropName: req.body.cropName,
      category: req.body.category,
      quantity: req.body.quantity,
      price: req.body.price,
      qualityGrade: req.body.qualityGrade,
      farmerId: req.body.farmerId
    });

    await newCrop.save();

    res.json({
      success: true,
      message: "Crop added successfully",
      data: newCrop
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }

});

/* Get Crops */

app.get("/crops", async (req, res) => {

  try {

    console.log("Fetching crops");

    const crops = await Crop.find();

    res.json(crops);

  } catch (error) {

    console.error(error);

    res.status(500).json({ message: "Error fetching crops" });

  }

});

/* Start Server */


const PORT = 5050;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});