require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/antigravity_db";

app.use(express.json());
app.use(cors());

mongoose
    .connect(MONGO_URI)
    .then(() => console.log("✅ Connecté avec succès à MongoDB"))
    .catch((err) => console.error("❌ Erreur de connexion MongoDB:", err));

// Schema فرعية لتفاصيل كل نموذج (Gemini / GPT)
const modelDetailSchema = new mongoose.Schema({
    enabled: { type: Boolean, default: false },
    status: { type: String, enum: ["suspended", "active"], default: "suspended" },
    blockedAt: { type: Date, default: Date.now },
    daysToWait: { type: Number, default: 0 },
    hoursToWait: { type: Number, default: 0 },
    minutesToWait: { type: Number, default: 0 },
});

// Schema الحساب الأساسية
const accountSchema = new mongoose.Schema(
    {
        email: { type: String, required: true },
        ownerName: { type: String, required: true },
        gemini: modelDetailSchema,
        gpt: modelDetailSchema,
    },
    { timestamps: true }
);

const Account = mongoose.model("Account", accountSchema);

// جلب جميع الحسابات
app.get("/api/accounts", async (req, res) => {
    try {
        const accounts = await Account.find().sort({ createdAt: -1 });
        res.json(accounts);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

// إضافة حساب جديد
app.post("/api/accounts", async (req, res) => {
    try {
        const { email, ownerName, gemini, gpt } = req.body;

        const newAccount = new Account({
            email,
            ownerName,
            gemini: {
                ...gemini,
                blockedAt: new Date(),
            },
            gpt: {
                ...gpt,
                blockedAt: new Date(),
            },
        });

        const savedAccount = await newAccount.save();
        res.status(201).json(savedAccount);
    } catch (error) {
        res.status(400).json({ message: "Données invalides", error: error.message });
    }
});

// حذف حساب
app.delete("/api/accounts/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await Account.findByIdAndDelete(id);
        res.json({ message: "Compte supprimé avec succès" });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la suppression", error: error.message });
    }
});

// تحديث حساب موجود
app.put("/api/accounts/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { email, ownerName, gemini, gpt } = req.body;

        const updatedAccount = await Account.findByIdAndUpdate(
            id,
            { email, ownerName, gemini, gpt },
            { new: true } // لإرجاع البيانات الجديدة بعد التحديث
        );

        if (!updatedAccount) {
            return res.status(404).json({ message: "Compte non trouvé" });
        }

        res.json(updatedAccount);
    } catch (error) {
        res.status(400).json({ message: "Erreur lors de la mise à jour", error: error.message });
    }
});

app.get('/', (req, res) => {
    res.json({
        message: 'Hello World ',
        database: isConnected ? 'Connected to MongoDB Atlas ' : 'Connecting / Offline',
        status: 'success',
        timestamp: new Date().toISOString(),
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Serveur en cours d'exécution sur http://localhost:${PORT}`);
});