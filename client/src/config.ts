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
