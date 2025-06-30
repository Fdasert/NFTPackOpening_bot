const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto");

admin.initializeApp();
const db = admin.firestore();

const BOT_TOKEN = "7942953226:AAHri1jAKi_orylmcE3dGAJ3WwV3C_8NXt4";

// Проверка подписи initData
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

  console.log("🔍 [verifyInitData]");
  console.log("dataCheckString:", dataCheckString);
  console.log("hash from Telegram:", hash);
  console.log("generated hash:", hmac);
  console.log("valid:", isValid);

  return isValid;
}

exports.canOpenPack = functions.https.onCall(async (data, context) => {
  const { telegram_id, init_data } = data;

  console.log("📩 [canOpenPack] received:");
  console.log("telegram_id:", telegram_id);
  console.log("init_data (raw):", init_data);

  if (!verifyInitData(init_data, BOT_TOKEN)) {
    console.error("❌ [canOpenPack] Invalid initData!");
    throw new functions.https.HttpsError("permission-denied", "Недействительные данные Telegram");
  }

  const userRef = db.collection("users").doc(telegram_id);
  const doc = await userRef.get();

  const now = Date.now();
  const cooldown = 24 * 60 * 60 * 1000;

  if (doc.exists && now - doc.data().lastOpen < cooldown) {
    const waitMs = cooldown - (now - doc.data().lastOpen);
    console.log("🕒 [canOpenPack] Cooldown:", waitMs);
    return { canOpen: false, waitMs };
  }

  console.log("✅ [canOpenPack] Can open pack");
  return { canOpen: true };
});

exports.openPack = functions.https.onCall(async (data, context) => {
  const { telegram_id, init_data } = data;

  console.log("📩 [openPack] received:");
  console.log("telegram_id:", telegram_id);
  console.log("init_data (raw):", init_data);

  if (!verifyInitData(init_data, BOT_TOKEN)) {
    console.error("❌ [openPack] Invalid initData!");
    throw new functions.https.HttpsError("permission-denied", "Недействительные данные Telegram");
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
  console.log("🎁 [openPack] NFT dropped:", nft);

  return { nft };
});
