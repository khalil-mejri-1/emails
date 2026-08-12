require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 7000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/antigravity_db";

// Middleware
app.use(express.json());
app.use(cors()); // للسماح للـ React بالاتصال بالـ Backend

// 1. الاتصال بقاعدة البيانات MongoDB
mongoose
    .connect(MONGO_URI)
    .then(() => console.log("✅ Connecté avec succès à MongoDB"))
    .catch((err) => console.error("❌ Erreur de connexion MongoDB:", err));

// 2. تعريف Schema و Model الحسابات
const accountSchema = new mongoose.Schema(
    {
        email: { type: String, required: true },
        ownerName: { type: String, required: true },
        status: { type: String, enum: ["suspended", "active"], default: "suspended" },
        blockedAt: { type: Date, default: Date.now },
        daysToWait: { type: Number, default: 0 },
        hoursToWait: { type: Number, default: 0 },
        minutesToWait: { type: Number, default: 0 },
    },
    { timestamps: true }
);

const Account = mongoose.model("Account", accountSchema);

// 3. المسارات (Routes)

// جلب جميع الحسابات
app.get("/api/accounts", async (req, res) => {
    try {
        const accounts = await Account.find().sort({ createdAt: -1 });
        res.json(accounts);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

// إضافة حساب جديد إلى قاعدة البيانات
app.post("/api/accounts", async (req, res) => {
    try {
        const { email, ownerName, status, daysToWait, hoursToWait, minutesToWait } = req.body;

        const newAccount = new Account({
            email,
            ownerName,
            status,
            blockedAt: new Date(),
            daysToWait: status === "suspended" ? Number(daysToWait) : 0,
            hoursToWait: status === "suspended" ? Number(hoursToWait) : 0,
            minutesToWait: status === "suspended" ? Number(minutesToWait) : 0,
        });

        const savedAccount = await newAccount.save();
        res.status(201).json(savedAccount);
    } catch (error) {
        res.status(400).json({ message: "Données invalides", error: error.message });
    }
});

// حذف حساب من قاعدة البيانات
app.delete("/api/accounts/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await Account.findByIdAndDelete(id);
        res.json({ message: "Compte supprimé avec succès" });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la suppression", error: error.message });
    }
});

// تشغيل السيرفر
app.listen(PORT, () => {
    console.log(`🚀 Serveur en cours d'exécution sur http://localhost:${PORT}`);
});