const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const familySchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  birthDate: String,
  deathDate: String,
  gender: { type: String, required: true },
  parentId: Number,
  spouseId: Number,
  generation: { type: Number, required: true },
  avatar: String,
  occupation: String,
  location: String,
  bio: String,
});

const FamilyMember = mongoose.model("FamilyMember", familySchema);

app.get("/api/family", async (req, res) => {
  try {
    const members = await FamilyMember.find();
    console.log(`📋 Fetched ${members.length} family members`);
    res.json(members);
  } catch (error) {
    console.error("❌ Error fetching family data:", error);
    res.status(500).json({ error: "Failed to fetch family data" });
  }
});

app.post("/api/family", async (req, res) => {
  try {
    console.log("📝 Adding new family member:", req.body);

    if (!req.body.name || !req.body.gender || !req.body.generation) {
      return res.status(400).json({
        error:
          "Missing required fields: name, gender, and generation are required",
      });
    }
    const existing = await FamilyMember.find().sort({ id: -1 }).limit(1);
    const nextId = existing.length > 0 ? existing[0].id + 1 : 1;

    const newMember = new FamilyMember({
      ...req.body,
      id: req.body.id || nextId,
      birthDate: req.body.birthDate || null,
      deathDate: req.body.deathDate || null,
      parentId: req.body.parentId || null,
      spouseId: req.body.spouseId || null,
      avatar: req.body.avatar || "",
      occupation: req.body.occupation || "",
      location: req.body.location || "",
      bio: req.body.bio || "",
    });

    const savedMember = await newMember.save();
    console.log("✅ New family member added:", savedMember.name);
    res.status(201).json(savedMember);
  } catch (error) {
    console.error("❌ Error in POST /api/family:", error);

    if (error.code === 11000) {
      res
        .status(400)
        .json({ error: "A family member with this ID already exists" });
    } else if (error.name === "ValidationError") {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to add family member" });
    }
  }
});

app.put("/api/family/:id", async (req, res) => {
  try {
    const memberId = Number(req.params.id);
    console.log("✏️ Updating family member:", memberId, req.body);

    if (!req.body.name || !req.body.gender || !req.body.generation) {
      return res.status(400).json({
        error:
          "Missing required fields: name, gender, and generation are required",
      });
    }

    const updatedMember = await FamilyMember.findOneAndUpdate(
      { id: memberId },
      {
        ...req.body,
        birthDate: req.body.birthDate || null,
        deathDate: req.body.deathDate || null,
        parentId: req.body.parentId || null,
        spouseId: req.body.spouseId || null,
        avatar: req.body.avatar || "",
        occupation: req.body.occupation || "",
        location: req.body.location || "",
        bio: req.body.bio || "",
      },
      { new: true, runValidators: true }
    );

    if (!updatedMember) {
      return res.status(404).json({ error: "Family member not found" });
    }

    console.log("✅ Family member updated:", updatedMember.name);
    res.json(updatedMember);
  } catch (error) {
    console.error("❌ Error updating family member:", error);

    if (error.name === "ValidationError") {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to update family member" });
    }
  }
});

app.delete("/api/family/:id", async (req, res) => {
  try {
    const memberId = Number(req.params.id);
    console.log("🗑️ Deleting family member:", memberId);

    const deletedMember = await FamilyMember.findOneAndDelete({
      id: memberId,
    });

    if (!deletedMember) {
      return res.status(404).json({ error: "Family member not found" });
    }

    console.log("✅ Family member deleted:", deletedMember.name);
    res.json({ message: "Family member deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting family member:", error);
    res.status(500).json({ error: "Failed to delete family member" });
  }
});

app.get("/api/family/:id", async (req, res) => {
  try {
    const memberId = Number(req.params.id);
    const member = await FamilyMember.findOne({ id: memberId });

    if (!member) {
      return res.status(404).json({ error: "Family member not found" });
    }

    res.json(member);
  } catch (error) {
    console.error("❌ Error fetching family member:", error);
    res.status(500).json({ error: "Failed to fetch family member" });
  }
});

app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const path = require("path");
app.use(express.static(path.join(__dirname)));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(
    `📊 MongoDB connected: ${
      mongoose.connection.readyState === 1 ? "Yes" : "No"
    }`
  );
});
