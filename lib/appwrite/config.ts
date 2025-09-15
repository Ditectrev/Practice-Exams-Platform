import { Client, Account, Databases } from "appwrite";

// Only initialize Appwrite client if we have the required environment variables
// This prevents build-time errors during static generation
const isClientSide = typeof window !== "undefined";
const hasRequiredEnvVars =
  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT &&
  process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

const client =
  isClientSide && hasRequiredEnvVars
    ? new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    : null;

export const account = client ? new Account(client) : null;
export const databases = client ? new Databases(client) : null;

export default client;
