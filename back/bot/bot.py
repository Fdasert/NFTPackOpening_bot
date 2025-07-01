from telegram import InlineKeyboardMarkup, InlineKeyboardButton, Update
from telegram.ext import Application, CommandHandler, ContextTypes

TOKEN = '7942953226:AAHri1jAKi_orylmcE3dGAJ3WwV3C_8NXt4'
WEB_APP_URL = "https://fdasert.github.io/NFTPackOpening_bot/"

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton("Открыть WebApp", web_app={"url": WEB_APP_URL})]
    ])
    await update.message.reply_text("Жми на кнопку:", reply_markup=keyboard)

app = Application.builder().token(TOKEN).build()
app.add_handler(CommandHandler("start", start))
app.run_polling()

if __name__ == '__main__':
    app = ApplicationBuilder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    print("Бот запущен...")
    app.run_polling()
