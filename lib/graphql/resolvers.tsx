import { fetchQuestions } from "@azure-fundamentals/lib/graphql/repoQuestions";

const resolvers = {
  Query: {
    questions: async (
      _: unknown,
      { link }: { link: string },
      { dataSources }: { dataSources: any },
    ) => {
      return dataSources.questionsDB.getQuestions(link);
    },
    questionById: async (
      _: unknown,
      { id, link }: { id: string; link: string },
      { dataSources }: { dataSources: any },
    ) => {
      return dataSources.questionsDB.getQuestion(id, link);
    },
    randomQuestions: async (
      _: unknown,
      { range, link }: { range: number; link: string },
      { dataSources }: { dataSources: any },
    ) => {
      return dataSources.questionsDB.getRandomQuestions(range, link);
    },
  },
};

export default resolvers;
