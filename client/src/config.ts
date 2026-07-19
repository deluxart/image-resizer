/**
 * Single source of truth for client configuration.
 * In a real deployment the API URL would come from an env variable
 * (import.meta.env.VITE_API_URL); kept inline here for the assignment.
 */
export const config = {
  apiBaseUrl: "http://localhost:5080",
  maxImages: 10, // assignment: max 10 images per user
  acceptedTypes: ["image/jpeg", "image/png"] as const,
  defaultPercentage: 50,
} as const;

export const author = {
  name: "Aleksandr Osadchiy",
  year: 2026,
  github: "https://github.com/deluxart",
  linkedin: "https://www.linkedin.com/in/aleksandr-osadchiy",
  email: "deluxart3@gmail.com",
} as const;
