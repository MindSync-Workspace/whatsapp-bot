import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: "https://mindsync.zildjianvito.com/api",
});
