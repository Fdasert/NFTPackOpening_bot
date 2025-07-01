from telegram import InlineKeyboardMarkup, InlineKeyboardButton, Update
from telegram.ext import Application, CommandHandler, ContextTypes

TOKEN = '7942953226:AAEOsJ9D0jPQEpN0-O1cfShex6hYj7lB6bM'
WEB_APP_URL = "https://nft-pack-opening-bot.vercel.app"

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton("Открыть WebApp", web_app={"url": WEB_APP_URL})]
    ])
    await update.message.reply_text("Жми на кнопку:", reply_markup=keyboard)

app = Application.builder().token(TOKEN).build()
app.add_handler(CommandHandler("start", start))
app.run_polling()
