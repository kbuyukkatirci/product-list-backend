const express = require("express");
const axios = require("axios");
const products = require("./products.json");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());


const GOLD_API_URL = "https://api.metalpriceapi.com/v1/latest";
const API_KEY = process.env.GOLD_API_KEY ; 

const calculatePrice = (popularityScore, weight, goldPricePerGram) => {
  return ((popularityScore + 1) * weight * goldPricePerGram).toFixed(2);
};


app.get("/api/products", async (req, res) => {
  try {
  
    const { minPrice, maxPrice, minPopularity, maxPopularity } = req.query;


    const response = await axios.get(GOLD_API_URL, {
      params: {
        api_key: API_KEY,
        base: "USD",
        currencies: "XAU" 
      }
    });

    
    const goldPricePerGram = response.data.rates.USDXAU / 31.1035; // XAU ons cinsindendir, 1 ons = 31.1035 gram

    console.log("API Response:", response.data);
    console.log("Gold Price Per Gram:", goldPricePerGram);


    let updatedProducts = products.map((product) => {
      const { popularityScore, weight } = product;
      const price = calculatePrice(popularityScore, weight, goldPricePerGram);
      return { ...product, price: parseFloat(price) };
    });

 
    if (minPrice || maxPrice || minPopularity || maxPopularity) {
      updatedProducts = updatedProducts.filter((product) => {
        const isWithinPriceRange =
          (!minPrice || product.price >= parseFloat(minPrice)) &&
          (!maxPrice || product.price <= parseFloat(maxPrice));
        const isWithinPopularityRange =
          (!minPopularity || product.popularityScore >= parseInt(minPopularity) * 20) &&
          (!maxPopularity || product.popularityScore <= parseInt(maxPopularity) * 20);
        return isWithinPriceRange && isWithinPopularityRange;
      });
    }


    res.json(updatedProducts);
  } catch (error) {
    console.error("Altın fiyatı alınırken hata:", error.message);
    res.status(500).json({ error: "Altın fiyatı alınamadı." });
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
