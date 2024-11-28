import {
  Client,
  type GroupNotification,
  GroupNotificationTypes,
  LocalAuth,
} from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import { handleMessage } from "./src";

const port = 3005;

const client = new Client({
  authStrategy: new LocalAuth(),
  webVersionCache: {
    type: "remote",
    remotePath:
      "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
  },
  puppeteer: {
    executablePath:
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    //  "/usr/bin/google-chrome-stable",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("Bot Siap !");
});

type Notif = {
  notification: {
    id: {
      id: string;
    };
  };
};

client.on("group_update", async (notification) => {
  if (notification.type === "announce") {
    await client.sendMessage(notification.chatId, "Secepetan kito gas"); // Mengirim pesan
  }
});

client.on("message_create", async (msg) => {
  const reply = await handleMessage(msg, client);
  if (reply !== undefined && reply !== null) {
    await msg.reply(reply);
  }
});

client.initialize();
