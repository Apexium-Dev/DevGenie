import fs from "fs";
import {
  Client,
  TextChannel,
  ChannelType,
  PermissionFlagsBits,
} from "discord.js";
import cron from "node-cron";

const FILE_PATH = "./reminders.json";

export interface Reminder {
  userId: string;
  username: string;
  guildId: string;
  reminderName: string;
  eventDate: Date;
  notifiedDays: number[];
}

let reminders: Reminder[] = [];

export function loadReminders() {
  if (fs.existsSync(FILE_PATH)) {
    const data = fs.readFileSync(FILE_PATH, "utf-8");
    reminders = JSON.parse(data);
    reminders.forEach((r) => {
      r.eventDate = new Date(r.eventDate);
      r.notifiedDays = r.notifiedDays || [];
    });
  }
}

export function saveReminders() {
  fs.writeFileSync(FILE_PATH, JSON.stringify(reminders, null, 2));
}

export function addReminder(reminder: Reminder) {
  reminder.notifiedDays = [];
  reminders.push(reminder);
  saveReminders();
}

export function setupReminderCheck(client: Client) {
  cron.schedule("* * * * *", async () => {
    const now = new Date();

    reminders = reminders.filter((r) => {
      const diffMs = r.eventDate.getTime() - now.getTime();
      return diffMs >= 0;
    });
    saveReminders();

    for (const r of reminders) {
      const diffMs = r.eventDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      const notifyDays = [10, 5, 4, 3, 2, 1];

      try {
        if (diffDays === 0 && !r.notifiedDays.includes(0)) {
          await sendReminder(client, r, 0);
          r.notifiedDays.push(0);
          saveReminders();
          continue;
        }

        if (diffDays === 1) {
          const currentHour = now.getHours();
          if (!r.notifiedDays.includes(-currentHour)) {
            await sendReminder(client, r, diffDays);
            r.notifiedDays.push(-currentHour);
            saveReminders();
          }
          continue;
        }

        if (notifyDays.includes(diffDays)) {
          if (!r.notifiedDays.includes(diffDays)) {
            await sendReminder(client, r, diffDays);
            r.notifiedDays.push(diffDays);
            saveReminders();
          }
        }
      } catch (err) {
        console.error("[ReminderCheck] Error:", err);
      }
    }
  });
}

async function sendReminder(
  client: Client,
  r: Reminder,
  diffDays: number
): Promise<void> {
  const guild = await client.guilds.fetch(r.guildId);

  const botMember = await guild.members.fetch(client.user!.id);
  if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
    console.warn(
      `[ReminderCheck] Missing ManageChannels permission in guild ${guild.name}`
    );
    return;
  }

  let channel = guild.channels.cache.find(
    (ch) => ch.name === "🧞reminders" && ch.type === ChannelType.GuildText
  ) as TextChannel | undefined;

  if (!channel) {
    channel = await guild.channels.create({
      name: "🧞reminders",
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: r.userId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
        {
          id: client.user!.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
      ],
    });
  }

  let message = "";

  if (diffDays > 0) {
    message = `🔔 <@${r.userId}>, you have **${diffDays}** day(s) left until **${r.reminderName}**! 📚`;
  } else if (diffDays === 0) {
    message = `✅ <@${r.userId}>, today is the day for **${r.reminderName}**! Good luck! 🎉`;
  }

  await channel.send(message);
}
