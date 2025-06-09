const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { db } = require("../firebase");

const SECRET_KEY = process.env.JWT_SECRET_KEY;

// Login route
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username and password are required" });
    }

    // Fetch user by username
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("username", "==", username).get();

    if (snapshot.empty) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const userDoc = snapshot.docs[0];
    const user = userDoc.data();

    // Compare password using bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        uid: userDoc.id,
        username: user.username,
        role: user.role,
        apartmentShortcut: user.apartmentShortcut,
      },
      SECRET_KEY,
      { expiresIn: "2h" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        username: user.username,
        role: user.role,
        apartmentShortcut: user.apartmentShortcut,
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  }
});

module.exports = router;
