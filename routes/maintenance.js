const express = require("express");
const router = express.Router();
const { db, admin } = require("../firebase");
const authenticate = require("../middleware"); // Middleware to decode JWT and set req.user

// Create monthly maintenance
router.post("/create-monthly", authenticate, async (req, res) => {
  try {
    const { month, year } = req.body;
    const { role, apartmentShortcut, username } = req.user;

    // Step 1: Authorization check
    if (!["admin", "secretary"].includes(role)) {
      return res.status(403).json({ success: false, message: "Only admin or secretary can create maintenance" });
    }

    if (!month || !year) {
      return res.status(400).json({ success: false, message: "Month and year are required" });
    }

    // Step 2: Check if maintenance already exists for this month/year/apartment
    const existing = await db.collection("maintenance")
      .where("month", "==", month)
      .where("year", "==", year)
      .where("apartmentShortcut", "==", apartmentShortcut)
      .limit(1)
      .get();

    if (!existing.empty) {
      return res.status(400).json({ success: false, message: "Maintenance already exists for this month" });
    }

    // Step 3: Get all users in same apartment
    const usersSnap = await db.collection("users")
      .where("apartmentShortcut", "==", apartmentShortcut)
      .get();

    const batch = db.batch();
    const now = admin.firestore.FieldValue.serverTimestamp();

    usersSnap.forEach(userDoc => {
      const userId = userDoc.id;
      const maintenanceRef = db.collection("maintenance").doc();

      batch.set(maintenanceRef, {
        bill_id: maintenanceRef.id,
        user_id: userId,
        apartmentShortcut,
        createdBy: username,
        createdAt: now,
        paid_date: null,
        status: "unpaid",
        month,
        year
      });
    });

    await batch.commit();

    return res.json({ success: true, message: "Maintenance records created successfully" });

  } catch (err) {
    console.error("Error creating maintenance:", err);
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  }
});


router.get("/by-month", authenticate, async (req, res) => {
  try {
    const { month, year } = req.query;
    const { role, apartmentShortcut } = req.user;

    if (!["admin", "secretary"].includes(role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (!month || !year) {
      return res.status(400).json({ success: false, message: "Month and year are required" });
    }

    const snapshot = await db
      .collection("maintenance")
      .where("month", "==", month)
      .where("year", "==", parseInt(year))
      .where("apartmentShortcut", "==", apartmentShortcut)
      .get();

    const data = [];
    snapshot.forEach(doc => {
      data.push({ id: doc.id, ...doc.data() });
    });

    return res.json({ success: true, maintenanceRecords: data });

  } catch (err) {
    console.error("Error fetching maintenance:", err);
    res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  }
});

module.exports = router;
