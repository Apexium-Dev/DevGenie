# 📅 DevGenie Discord Reminder Bot

A simple Discord bot that lets users set reminders using the `!reminder` command. It checks daily and sends notifications to a reminders channel.

---

## ⚙️ Features

- Set a reminder with a date: `!reminder <reminder name> DD.MM.YYYY`
- Daily reminder checks
- Sends notifications in the #🧞reminders channel
- Stores reminders persistently in `reminders.json`

---

## 🚀 Setup & Run

### 1. Clone the repository

```bash
git clone https://github.com/Apexium-Dev/DevGenie.git
cd DevGenie
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create .env file

```bash
TOKEN=YOUR-DISCORD-TOKEN-HERE
```

### 4. Start the bot

```bash
npm run dev
```
