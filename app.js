const express = require("express");
require("dotenv").config();
const checkApartmentRoute = require("./routes/createAppartement.js");
const login = require("./routes/login.js");
const maintenance = require("./routes/maintenance.js");

const app = express();
app.use(express.json());

// Use the route
app.use("/create-apartment", checkApartmentRoute);
app.use("/login",login);
app.use("/create-maintenance",maintenance);

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
