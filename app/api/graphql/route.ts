import {
  CombinedQuestionsDataSource,
  RepoQuestionsDataSource,
} from "@azure-fundamentals/lib/graphql/questionsDataSource";
import { ApolloServer, BaseContext } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import typeDefs from "@azure-fundamentals/lib/graphql/schemas";
import resolvers from "@azure-fundamentals/lib/graphql/resolvers";
import { fetchQuestions } from "@azure-fundamentals/lib/graphql/repoQuestions";

interface ContextValue {
  dataSources: {
    questionsDB: BaseContext;
  };
}

const server = new ApolloServer<ContextValue>({
  typeDefs,
  resolvers,
  introspection: process.env.NODE_ENV !== "production",
});

const handler = startServerAndCreateNextHandler(server, {
  context: async () => {
    if (process.env.AZURE_COSMOSDB_ENDPOINT) {
      return {
        dataSources: {
          questionsDB: CombinedQuestionsDataSource(),
        },
      };
    } else {
      // Fallback to GitHub-only data source
      return {
        dataSources: {
          questionsDB: {
            getQuestion: async (id: string, link: string) => {
              const questions = await fetchQuestions(link);
              return questions?.find((q: any) => q.id === id);
            },
            getQuestions: async (link: string) => {
              const questions = await fetchQuestions(link);
              return { count: questions?.length || 0 };
            },
            getRandomQuestions: async (range: number, link: string) => {
              const questions = await fetchQuestions(link);
              const shuffled = questions?.sort(() => 0.5 - Math.random());
              return shuffled?.slice(0, range) || [];
            },
          },
        },
      };
    }
  },
});

// Wrap the handler to handle errors
const wrappedHandler = async (req: Request) => {
  try {
    return await handler(req);
  } catch (error) {
    return new Response(
      JSON.stringify({
        errors: [{ message: "Internal server error" }],
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
};

export { wrappedHandler as GET, wrappedHandler as POST };
