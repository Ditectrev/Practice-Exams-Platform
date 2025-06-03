import { Container } from "@azure/cosmos";
import { fetchQuestions } from "./repoQuestions";

export const QuestionsDataSource = (container: Container) => {
  return {
    async getQuestion(id: string) {
      const querySpec = {
        query: "SELECT * FROM c WHERE c.id = @id",
        parameters: [
          {
            name: "@id",
            value: id,
          },
        ],
      };

      try {
        const { resources: items } = await container.items
          .query(querySpec)
          .fetchAll();
        return items[0];
      } catch (err) {
        throw new Error("Error: " + err);
      }
    },
    async getQuestions() {
      const querySpec = {
        query: "SELECT VALUE COUNT(c.id) FROM c",
      };

      try {
        const { resources: items } = await container.items
          .query(querySpec)
          .fetchAll();
        return { count: items[0] };
      } catch (err) {
        throw new Error("Error: " + err);
      }
    },
  };
};

export const RepoQuestionsDataSource = (container: any) => {
  return {
    async getQuestion(id: string) {
      try {
        return container.filter((el: any) => el.id === id)[0];
      } catch (err) {
        throw new Error("Question Error: " + err);
      }
    },
    async getQuestions() {
      try {
        return { count: container.length };
      } catch (err) {
        throw new Error("Questions Count Error: " + err);
      }
    },
    async getRandomQuestions(range: number) {
      try {
        const shuffled = [...container].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, range);
      } catch (err) {
        throw new Error("Random Questions Error: " + err);
      }
    },
  };
};

export const CombinedQuestionsDataSource = (container: Container) => {
  return {
    async getQuestion(id: string, link: string) {
      try {
        // Try GitHub first
        const questions = await fetchQuestions(link);
        if (questions) {
          const question = questions.find((q: any) => q.id === id);
          if (question) {
            // Upload to Cosmos DB for future use
            try {
              await container.items.upsert(question);
            } catch (err) {
              console.warn("Failed to upload question to Cosmos DB:", err);
            }
            return question;
          }
        }

        // Fallback to Cosmos DB
        const querySpec = {
          query: "SELECT * FROM c WHERE c.id = @id",
          parameters: [{ name: "@id", value: id }],
        };
        const { resources: items } = await container.items
          .query(querySpec)
          .fetchAll();
        return items[0];
      } catch (err) {
        throw new Error("Error fetching question: " + err);
      }
    },

    async getQuestions(link: string) {
      try {
        // Try GitHub first
        const questions = await fetchQuestions(link);
        if (questions) {
          // Upload all questions to Cosmos DB
          try {
            for (const question of questions) {
              await container.items.upsert(question);
            }
          } catch (err) {
            console.warn("Failed to upload questions to Cosmos DB:", err);
          }
          return { count: questions.length };
        }

        // Fallback to Cosmos DB
        const querySpec = {
          query: "SELECT VALUE COUNT(c.id) FROM c",
        };
        const { resources: items } = await container.items
          .query(querySpec)
          .fetchAll();
        return { count: items[0] };
      } catch (err) {
        throw new Error("Error fetching questions: " + err);
      }
    },

    async getRandomQuestions(range: number, link: string) {
      try {
        // Try GitHub first
        const questions = await fetchQuestions(link);
        if (questions) {
          const shuffled = [...questions].sort(() => 0.5 - Math.random());
          const selected = shuffled.slice(0, range);

          // Upload selected questions to Cosmos DB
          try {
            for (const question of selected) {
              await container.items.upsert(question);
            }
          } catch (err) {
            console.warn("Failed to upload questions to Cosmos DB:", err);
          }

          return selected;
        }

        // Fallback to Cosmos DB
        const querySpec = {
          query: "SELECT * FROM c",
        };
        const { resources: items } = await container.items
          .query(querySpec)
          .fetchAll();
        const shuffled = [...items].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, range);
      } catch (err) {
        throw new Error("Error fetching random questions: " + err);
      }
    },
  };
};
