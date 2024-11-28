import WAWebJS, { Client } from "whatsapp-web.js";
import { commands } from "./utils/command";
import { axiosInstance } from "./utils/axiosInstance";
import { AxiosError } from "axios";

// const prefixArray = commands.map((command) => command.prefix.split("*")[1]);

export async function handleMessage(msg: WAWebJS.Message, client: Client) {
  const { body } = msg;

  switch (true) {
    case body === ".help":
      return handleHelp(body);
    case body.startsWith(".login"):
      return handleConnectWhatsapp(msg, client);
    case body === ".note":
      return handleGetNotes(msg, client);
    case body.startsWith(".note/buat"):
      return handleCreateNote(msg, client);
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

async function handleConnectWhatsapp(msg: WAWebJS.Message, client: Client) {
  try {
    msg.react("⏱️");

    const number = msg.from.split("@")[0];
    const secret_key = msg.body.split(".login")[1];

    const { data } = await axiosInstance.post("/whatsapps", {
      number: number,
      secret_key: secret_key.trim(),
    });

    console.log(data);
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

    let stringNotes = "";
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
