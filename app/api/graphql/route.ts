import {
  CombinedQuestionsDataSource,
  RepoQuestionsDataSource,
} from "@practice-tests-exams-platform/lib/graphql/questionsDataSource";
import { ApolloServer, BaseContext } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import typeDefs from "@practice-tests-exams-platform/lib/graphql/schemas";
import resolvers from "@practice-tests-exams-platform/lib/graphql/resolvers";
import { fetchQuestions } from "@practice-tests-exams-platform/lib/graphql/repoQuestions";

interface ContextValue {
  dataSources: {
    questionsDB: BaseContext;
  };
}

const server = new ApolloServer({
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
    const response = await handler(req);
    // Ensure response has proper headers
    if (!response.headers.get("Content-Type")) {
      const newHeaders = new Headers(response.headers);
      newHeaders.set("Content-Type", "application/json");
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    }
    return response;
  } catch (error: any) {
    console.error("GraphQL route error:", error);
    return new Response(
      JSON.stringify({
        errors: [
          {
            message: error?.message || "Internal server error",
            ...(process.env.NODE_ENV !== "production" && {
              stack: error?.stack,
            }),
          },
        ],
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
