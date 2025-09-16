import { Client, Account, Databases } from "appwrite";

// Only initialize Appwrite client if we have the required environment variables
// This prevents build-time errors during static generation
const isClientSide = typeof window !== "undefined";
const hasRequiredEnvVars =
  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT &&
  process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

console.log(
  "process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT",
  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
);
console.log(
  "process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID",
  process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
);
console.log(
  "process.env.NEXT_PUBLIC_APPWRITE_API_KEY",
  process.env.NEXT_PUBLIC_APPWRITE_API_KEY,
);
console.log(
  "process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID",
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
);
console.log(
  "process.env.NEXT_PUBLIC_APPWRITE_DATABASE_NAME",
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_NAME,
);
console.log(
  "process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID",
  process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID,
);
console.log(
  "process.env.NEXT_PUBLIC_GA_TRACKING_ID",
  process.env.NEXT_PUBLIC_GA_TRACKING_ID,
);
console.log(
  "process.env.AZURE_COSMOSDB_ENDPOINT",
  process.env.AZURE_COSMOSDB_ENDPOINT,
);
console.log("process.env.AZURE_COSMOSDB_KEY", process.env.AZURE_COSMOSDB_KEY);
console.log(
  "process.env.AZURE_COSMOSDB_DATABASE",
  process.env.AZURE_COSMOSDB_DATABASE,
);

const client =
  isClientSide && hasRequiredEnvVars
    ? new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    : null;

export const account = client ? new Account(client) : null;
export const databases = client ? new Databases(client) : null;

export default client;
