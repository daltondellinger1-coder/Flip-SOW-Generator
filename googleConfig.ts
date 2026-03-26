// IMPORTANT: In a real application, these values should be stored in
// environment variables, not hardcoded in the source code.

// The API Key is sourced from the environment variable `process.env.API_KEY`.
// This is automatically provided by the execution environment and is used for
// services like Google Geocoding.
export const GOOGLE_API_KEY = process.env.API_KEY as string;
