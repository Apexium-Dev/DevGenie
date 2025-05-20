import { Client, GatewayIntentBits } from "discord.js";
import * as dotenv from "dotenv";
import { addReminder, setupReminderCheck, loadReminders } from "./reminder";

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", () => {
  console.log("Bot Started");
  loadReminders();
  setupReminderCheck(client);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith("!reminder")) {
    const args = message.content.split(" ").slice(1);
    if (args.length < 2) {
      message.reply("❌ Usage: `!reminder reminderName DD.MM.YYYY`");
      return;
    }

    const reminderName = args.slice(0, -1).join(" ");
    const dateStr = args[args.length - 1];

    const [day, month, year] = dateStr.split(".");
    const eventDate = new Date(`${year}-${month}-${day}`);

    if (isNaN(eventDate.getTime())) {
      message.reply("❌ Invalid date. Please use format: `DD.MM.YYYY`");
      return;
    }

    addReminder({
      userId: message.author.id,
      username: message.author.username,
      guildId: message.guild!.id,
      reminderName,
      eventDate,
      notifiedDays: [],
    });

    message.reply(
      `✅ Reminder set for **${reminderName}** on **${dateStr}**. I’ll remind you in #🧞reminders!`
    );
  }
});

client.login(process.env.TOKEN);
