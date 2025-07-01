const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto");
const cors = require("cors")({ origin: true }); // разрешить все источники

admin.initializeApp();
const db = admin.firestore();

const botToken = "7942953226:AAHri1jAKi_orylmcE3dGAJ3WwV3C_8NXt4";

// Проверка подписи initData (пример)
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
  return hmac === hash;
}

// Функция canOpenPack с CORS
exports.canOpenPack = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method === "OPTIONS") {
      return res.status(204).send("");
    }
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const { telegram_id, init_data } = req.body;

    if (!telegram_id || !init_data) {
      return res.status(400).send("Missing parameters");
    }

    if (!verifyInitData(init_data, botToken)) {
      return res.status(403).send("Invalid initData");
    }

    const userRef = db.collection("users").doc(telegram_id);
    const doc = await userRef.get();

    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000;

    if (doc.exists && now - doc.data().lastOpen < cooldown) {
      const waitMs = cooldown - (now - doc.data().lastOpen);
      return res.json({ canOpen: false, waitMs });
    }

    res.json({ canOpen: true });
  });
});

// Функция openPack с CORS
exports.openPack = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method === "OPTIONS") {
      return res.status(204).send("");
    }
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const { telegram_id, init_data } = req.body;

    if (!telegram_id || !init_data) {
      return res.status(400).send("Missing parameters");
    }

    if (!verifyInitData(init_data, botToken)) {
      return res.status(403).send("Invalid initData");
    }

    const userRef = db.collection("users").doc(telegram_id);
    const now = Date.now();

    await userRef.set({ lastOpen: now }, { merge: true });

    const nftList = [
      { name: "Dragon", rarity: "legendary" },
      { name: "Wolf", rarity: "common" },
      { name: "Tiger", rarity: "rare" }
    ];

    const nft = nftList[Math.floor(Math.random() * nftList.length)];

    res.json({ nft });
  });
});
