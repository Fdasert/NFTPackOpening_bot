const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto");
const cors = require("cors");

admin.initializeApp();
const db = admin.firestore();

const botToken = "7942953226:AAEOsJ9D0jPQEpN0-O1cfShex6hYj7lB6bM";
  
const corsHandler = cors({
  origin: "https://nft-pack-opening-bot.vercel.app",
});

function verifyInitData(initData, botToken) {
  if (!initData || typeof initData !== "string") return false;

  const secret = crypto.createHash("sha256").update(botToken).digest();
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  params.delete("hash");

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => `${key}=${val}`)
    .join("\n");

  const hmac = crypto.createHmac("sha256", secret).update(dataCheckString).digest("hex");
  const isValid = hmac === hash;

  console.log("🔍 [verifyInitData]", { dataCheckString, hash, hmac, isValid });
  console.log("initData =", initData);
  console.log("dataCheckString =", dataCheckString);
  console.log("expected hash =", hash);
  console.log("generated hash =", hmac);
  return isValid;
}

exports.canOpenPack = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    const { telegram_id, init_data } = req.body;

    if (!verifyInitData(init_data, botToken)) {
      console.error("❌ Invalid initData");
      return res.status(403).json({ error: "Invalid initData" });
    }

    try {
      const userRef = db.collection("users").doc(telegram_id);
      const doc = await userRef.get();

      const now = Date.now();
      const cooldown = 24 * 60 * 60 * 1000;

      if (doc.exists && now - doc.data().lastOpen < cooldown) {
        const waitMs = cooldown - (now - doc.data().lastOpen);
        return res.json({ canOpen: false, waitMs });
      }

      return res.json({ canOpen: true });
    } catch (err) {
      console.error("🔥 Error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
});

exports.openPack = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    const { telegram_id, init_data } = req.body;

    if (!verifyInitData(init_data, botToken)) {
      return res.status(403).json({ error: "Invalid initData" });
    }

    try {
      const userRef = db.collection("users").doc(telegram_id);
      await userRef.set({ lastOpen: Date.now() }, { merge: true });

      const nftList = [
        { name: "Dragon", rarity: "legendary" },
        { name: "Wolf", rarity: "common" },
        { name: "Tiger", rarity: "rare" },
      ];
      const nft = nftList[Math.floor(Math.random() * nftList.length)];

      return res.json({ nft });
    } catch (err) {
      console.error("🔥 Error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
});
