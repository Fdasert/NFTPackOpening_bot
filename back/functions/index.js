/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/https");
const logger = require("firebase-functions/logger");

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto");

admin.initializeApp();
const db = admin.firestore();

const BOT_TOKEN = "твой_бот_токен"; // ОБЯЗАТЕЛЬНО ТОЧНО ТОТ, ЧТО У БОТА

function verifyInitData(initData, botToken) {
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

exports.canOpenPack = functions.https.onCall(async (data, context) => {
  const { telegram_id, init_data } = data;

  if (!verifyInitData(init_data, BOT_TOKEN)) {
    throw new functions.https.HttpsError("permission-denied", "Недействительные данные Telegram");
  }

  const userRef = db.collection("users").doc(telegram_id);
  const doc = await userRef.get();

  const now = Date.now();
  const cooldown = 24 * 60 * 60 * 1000;

  if (doc.exists && now - doc.data().lastOpen < cooldown) {
    return {
      canOpen: false,
      waitMs: cooldown - (now - doc.data().lastOpen)
    };
  }

  return { canOpen: true };
});

exports.openPack = functions.https.onCall(async (data, context) => {
  const { telegram_id, init_data } = data;

  if (!verifyInitData(init_data, BOT_TOKEN)) {
    throw new functions.https.HttpsError("permission-denied", "Недействительные данные Telegram");
  }

  const userRef = db.collection("users").doc(telegram_id);
  const now = Date.now();

  await userRef.set({ lastOpen: now }, { merge: true });

  // Генерация NFT (в реальности тут вероятно будет своя логика)
  const nftList = [
    { name: "Dragon", rarity: "legendary" },
    { name: "Wolf", rarity: "common" },
    { name: "Tiger", rarity: "rare" }
  ];

  const nft = nftList[Math.floor(Math.random() * nftList.length)];

  return { nft };
});

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
