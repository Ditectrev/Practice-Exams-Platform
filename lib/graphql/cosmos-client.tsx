import { CosmosClient } from "@azure/cosmos";

export const getDatabase = () => {
  const client = new CosmosClient({
    endpoint: process.env.AZURE_COSMOSDB_ENDPOINT!,
    key: process.env.AZURE_COSMOSDB_KEY!,
  });

  return client.database(process.env.AZURE_COSMOSDB_DATABASE!);
};

export const getQuestionsContainer = async () => {
  const database = getDatabase();

  // Try to create container if it doesn't exist
  try {
    const { container } = await database.containers.createIfNotExists({
      id: "questions",
      partitionKey: {
        paths: ["/examId"],
      },
    });
    return container;
  } catch (error: any) {
    // If container creation fails, try to get the existing container
    if (error.code === 409) {
      return database.container("questions");
    } else {
      throw error;
    }
  }
};
