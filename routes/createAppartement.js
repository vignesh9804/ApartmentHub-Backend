const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const { db, admin } = require("../firebase"); // `admin` for timestamp
const authenticateToken = require("../middleware");

// Check if apartment shortcut is already taken
router.post("/check-shortcut", async (req, res) => {
  const { shortcut } = req.body;
  if (!shortcut) return res.status(400).json({ success: false, message: "Shortcut is required" });

  const doc = await db.collection("apartments").doc(shortcut).get();
  if (doc.exists) {
    return res.json({ success: false, message: "Shortcut already exists" });
  } else {
    return res.json({ success: true, message: "Shortcut available" });
  }
});

// Register apartment + admin (all in Firestore)
router.post("/register", async (req, res) => {
  try {
    const {
      appartmentName,
      shortcut,
      username,
      password,
      userEmail,
      role
    } = req.body;

    // Check if shortcut already exists
    const apartmentDoc = await db.collection("apartments").doc(shortcut).get();
    if (apartmentDoc.exists) {
      return res.status(400).json({ success: false, message: "Shortcut already exists" });
    }

    const checkUser = await db.collection("users").doc(username).get();
    if (checkUser.exists) {
      return res.json({ success: false, message: "User already exists" });
    }

    // Step 1: Create apartment document
    await db.collection("apartments").doc(shortcut).set({
      name: appartmentName,
      shortcut: shortcut,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Step 2: Create admin user document in users collection
    const hashedPassword = await bcrypt.hash(password,10);
    const userDocRef = db.collection("users").doc(); // auto generated id

    await userDocRef.set({
      username,
      email: userEmail,
      password:hashedPassword,            // store hashed password in real apps (never plain text)
      role,
      apartmentShortcut: shortcut,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ success: true, message: "Apartment and admin created successfully" });

  } catch (err) {
    console.error("Error registering:", err);
    res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  }
});

router.post("/admin-add-user", authenticateToken, async (req, res) => {
  try {
    const { username, password, userEmail, role, shortcut } = req.body;

    // Query for existing username
    const existingUserQuery = await db
      .collection("users")
      .where("username", "==", username)
      .limit(1)
      .get();

    if (!existingUserQuery.empty) {
      return res.json({ success: false, message: "User already exists" });
    }

    // Create user with auto-generated ID
    const hashedPassword = await bcrypt.hash(password,10);
    const userDocRef = db.collection("users").doc();

    await userDocRef.set({
      username,
      email: userEmail,
      password:hashedPassword, // In production: hash the password using bcrypt
      role,
      apartmentShortcut: shortcut,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ success: true, message: "User created successfully" });

  } catch (err) {
    console.error("Error adding user:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message
    });
  }
});


module.exports = router;
