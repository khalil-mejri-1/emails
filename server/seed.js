require("dotenv").config();
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/antigravity_db";

const accountsList = [
    "aze977906", "abc246544", "kmejri57", "mejrik1888", "khalilme0011",
    "patron2c0011", "kmejri020", "coderoute426", "khalilka321", "k09799735",
    "khalilmme5", "mejrikk78", "khalilmme1233", "khalilssa326", "aabc62101",
    "k45381477", "abxx9819", "kha974402", "k9223596", "k84696585",
    "khalil3838338", "khalil333433", "khalil0483kk", "khalila48382",
    "mechlaui0", "gesmi1971"
];

const modelDetailSchema = new mongoose.Schema({
    enabled: { type: Boolean, default: true },
    status: { type: String, enum: ["suspended", "active"], default: "suspended" },
    blockedAt: { type: Date, default: Date.now },
    daysToWait: { type: Number, default: 7 },
    hoursToWait: { type: Number, default: 0 },
    minutesToWait: { type: Number, default: 0 },
});

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

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ متصل بـ MongoDB...");

        const now = new Date();
        const data = accountsList.map((item) => {
            const name = item.trim();
            return {
                email: `${name}@gmail.com`,
                ownerName: name,
                gemini: { enabled: true, status: "suspended", blockedAt: now, daysToWait: 7, hoursToWait: 0, minutesToWait: 0 },
                gpt: { enabled: true, status: "suspended", blockedAt: now, daysToWait: 7, hoursToWait: 0, minutesToWait: 0 },
            };
        });

        const result = await Account.insertMany(data);
        console.log(`🚀 تم إدخال ${result.length} حساب بنجاح!`);
        process.exit(0);
    } catch (err) {
        console.error("❌ خطأ:", err);
        process.exit(1);
    }
}

seed();