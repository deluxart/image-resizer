import axios from "axios";
import { config } from "../../config";

/** Shared, pre-configured axios instance for all API calls. */
export const httpClient = axios.create({
  baseURL: config.apiBaseUrl,
});
