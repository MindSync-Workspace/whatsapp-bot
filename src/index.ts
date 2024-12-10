import WAWebJS, { Client } from "whatsapp-web.js";
import { commands } from "./utils/command";
import { axiosInstance } from "./utils/axiosInstance";
import { AxiosError } from "axios";
import MessageTypes from "whatsapp-web.js";
import { Buffer } from "buffer";
import path from "path";
import fs from "fs";
import FormData from "form-data";

// const prefixArray = commands.map((command) => command.prefix.split("*")[1]);
export async function handleMessage(msg: WAWebJS.Message, client: Client) {
  const { body } = msg;

  if (msg.type === "document") {
    return handleUploadDocument(msg, client);
  }

  switch (true) {
    case body === ".help":
      return handleHelp(body);
    case body.startsWith(".login"):
      return handleConnectWhatsapp(msg, client);
    case body === ".note":
      return handleGetNotes(msg, client);
    case body.startsWith(".note/buat"):
      return handleCreateNote(msg, client);
    case body.startsWith(".chat"):
      return handleChatDocument(msg, client);
    default:
      return null;
  }
}

function handleHelp(msg: string) {
  let messageBody = `**Daftar Perintah Bot:**\n\n`;
  for (const command of commands) {
    messageBody += `* ${command.prefix}: ${command.description}\n`;
  }
  return messageBody;
}

async function handleUploadDocument(msg: WAWebJS.Message, client: Client) {
  try {
    msg.react("⏱️");
    let media = await msg.downloadMedia(); // Download media dari pesan
    const number = msg.from.split("@")[0]; // Ambil nomor pengirim
    const fileTitle = media.filename?.split(".")[0] || "document";
    const fileExtension = media.mimetype?.split("/")[1] || "unknown";
    const filePath = `./media/${media.filename!}`;
    client.sendMessage(msg.from, "Tunggu,dokumen sedang diupload...");
    // Simpan file ke filesystem
    msg.react("3️⃣");
    const buffer = Buffer.from(media.data, "base64");
    const stream = fs.createWriteStream(filePath);
    stream.write(buffer);
    stream.end();

    await new Promise((resolve, reject) => {
      stream.on("finish", resolve);
      stream.on("error", reject);
    });

    const form = new FormData();
    form.append("file", fs.createReadStream(filePath));
    form.append("title", fileTitle); // Tambahkan title
    form.append("number", number); // Tambahkan nomor
    msg.react("2️⃣");
    const { data } = await axiosInstance.post(
      "/documents/whatsapps/upload",
      form
    );
    msg.react("1️⃣");
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`Gagal menghapus file: ${filePath}`, err);
      } else {
        console.log(`File berhasil dihapus: ${filePath}`);
      }
    });

    msg.react("✅");
    return `Dokumen dengan nama: *${fileTitle}* berhasil ditambahkan`;
  } catch (error) {
    msg.react("❌");
    if (error instanceof AxiosError) {
      console.log(error.response?.data);
      return error.response?.data?.detail[0];
    }
    return "Fitur sedang error, segera diperbaiki";
  }
}

async function handleChatDocument(msg: WAWebJS.Message, client: Client) {
  try {
    msg.react("⏱️");
    const number = msg.from.split("@")[0];
    const message = msg.body.split(".chat")[1];
    // console.log(pinnedMsg);
    const { data } = await axiosInstance.post("/chats/whatsapps", {
      number: number,
      is_human: false,
      text: message,
    });
    msg.react("✅");
    return data.data.text;
  } catch (error) {
    msg.react("❌");
    if (error instanceof AxiosError) {
      console.log(error.response?.data.detail[0]);
      return error.response?.data.detail[0];
    }
    return "Fitur sedang error,segera diperbaiki";
  }
}

async function handleConnectWhatsapp(msg: WAWebJS.Message, client: Client) {
  try {
    msg.react("⏱️");

    const number = msg.from.split("@")[0];
    const secret_key = msg.body.split(".login")[1];

    const { data } = await axiosInstance.post("/whatsapps", {
      number: number,
      secret_key: secret_key.trim(),
    });

    msg.react("✅");
    return data.meta.message;
  } catch (error) {
    msg.react("❌");
    if (error instanceof AxiosError) {
      console.log(error.response?.data);
      return error.response?.data.detail[0];
    }
    return "Fitur sedang error,segera diperbaiki";
  }
}

async function handleCreateNote(msg: WAWebJS.Message, client: Client) {
  try {
    msg.react("⏱️");
    const number = msg.from.split("@")[0];

    const text = msg.body.split(".note/buat")[1];
    const { data } = await axiosInstance.post("/notes/whatsapps", {
      number: number,
      text: text.trim(),
    });
    msg.react("✅");

    return data.meta.message;
  } catch (error) {
    msg.react("❌");
    if (error instanceof AxiosError) {
      console.log(error.response?.data.detail[0]);
      return error.response?.data.detail[0];
    }
    return "Fitur sedang error,segera diperbaiki";
  }
}

async function handleGetNotes(msg: WAWebJS.Message, client: Client) {
  try {
    msg.react("⏱️");
    const number = msg.from.split("@")[0];

    const { data } = await axiosInstance.get(`/notes/whatsapps/${number}`);

    if (!data?.data || Object.keys(data.data).length === 0) {
      msg.react("✅");
      return "Tidak ada note yang bisa ditampilkan";
    }

    let stringNotes = "List note kamu\n";
    await data.data.map(
      (note: any, index: number) =>
        (stringNotes += `\n${index + 1}. ${note.text}`)
    );

    msg.react("✅");
    return stringNotes;
  } catch (error) {
    msg.react("❌");
    if (error instanceof AxiosError) {
      console.log(error.response?.data.detail[0]);
      return error.response?.data.detail[0];
    }
    return "Fitur sedang error,segera diperbaiki";
  }
}
