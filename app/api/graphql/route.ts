import { NextRequest, NextResponse } from "next/server";
import {
  CombinedQuestionsDataSource,
  RepoQuestionsDataSource,
} from "@azure-fundamentals/lib/graphql/questionsDataSource";
import { ApolloServer, BaseContext } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import typeDefs from "@azure-fundamentals/lib/graphql/schemas";
import resolvers from "@azure-fundamentals/lib/graphql/resolvers";
import { fetchQuestions } from "@azure-fundamentals/lib/graphql/repoQuestions";

// Force Node.js runtime for Apollo Server
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ContextValue {
  dataSources: {
    questionsDB: BaseContext;
  };
}

let server: ApolloServer<ContextValue> | null = null;
let handler: ((req: Request) => Promise<Response>) | null = null;

// Initialize server lazily to catch initialization errors
function getHandler() {
  if (handler) return handler;

  try {
    server = new ApolloServer<ContextValue>({
      typeDefs,
      resolvers,
      introspection: process.env.NODE_ENV !== "production",
    });

    handler = startServerAndCreateNextHandler(server, {
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

    return handler;
  } catch (error: any) {
    console.error("Failed to initialize Apollo Server:", error);
    throw error;
  }
}

async function handleRequest(request: NextRequest) {
  try {
    const graphqlHandler = getHandler();
    const response = await graphqlHandler(request);
    return response;
  } catch (error: any) {
    console.error("GraphQL handler error:", error);
    return NextResponse.json(
      {
        errors: [
          {
            message: error?.message || "Internal server error",
            ...(process.env.NODE_ENV !== "production" && {
              stack: error?.stack,
            }),
          },
        ],
      },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}

export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}
