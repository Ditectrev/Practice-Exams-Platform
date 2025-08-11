import { Container } from "@azure/cosmos";
import { fetchQuestions, fetchQuestionsAndChecksum } from "./repoQuestions";
import { getQuestionsContainer } from "./cosmos-client";

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

// Helper function to extract exam ID from URL
const extractExamId = (link: string): string => {
  const segments = link.split("/");
  return segments[segments.length - 3].replace(/-/g, "_").toLowerCase();
};

// Metadata helpers used to detect dataset updates and resync a partition
const META_TYPE = "meta";
const metaIdForExam = (examId: string) => `_meta_${examId}`;
const SYNC_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

const readMeta = async (container: Container, examId: string) => {
  try {
    const { resource } = await container
      .item(metaIdForExam(examId), examId)
      .read<any>();
    return resource as any | undefined;
  } catch (_err) {
    return undefined;
  }
};

const writeMeta = async (
  container: Container,
  examId: string,
  checksum: string,
) => {
  const metaDoc = {
    id: metaIdForExam(examId),
    examId,
    type: META_TYPE,
    checksum,
    updatedAt: new Date().toISOString(),
  };
  await container.items.upsert(metaDoc);
};

const purgeExamPartition = async (container: Container, examId: string) => {
  // Select IDs for non-meta docs within the partition
  const querySpec = {
    query:
      "SELECT c.id FROM c WHERE c.examId = @examId AND (NOT IS_DEFINED(c.type) OR c.type != @metaType)",
    parameters: [
      { name: "@examId", value: examId },
      { name: "@metaType", value: META_TYPE },
    ],
  };
  const { resources } = await container.items.query(querySpec).fetchAll();
  for (const { id } of resources as Array<{ id: string }>) {
    try {
      await container.item(id, examId).delete();
    } catch (err) {
      console.warn(`Failed to delete item ${id} in exam ${examId}:`, err);
    }
  }
};

const seedExamPartition = async (
  container: Container,
  examId: string,
  questions: any[],
  checksum: string,
) => {
  for (const question of questions) {
    const questionWithExamId = { ...question, examId };
    await container.items.upsert(questionWithExamId);
  }
  await writeMeta(container, examId, checksum);
};

const ensureExamSynced = async (
  container: Container,
  examId: string,
  link: string,
) => {
  try {
    const meta = await readMeta(container, examId);
    // Cooldown: avoid fetching upstream too frequently
    if (meta && meta.updatedAt) {
      const last = new Date(meta.updatedAt).getTime();
      if (!Number.isNaN(last) && Date.now() - last < SYNC_COOLDOWN_MS) {
        return;
      }
    }

    const result = await fetchQuestionsAndChecksum(link);
    if (!result) return;

    const { questions, checksum } = result;
    if (!meta || meta.checksum !== checksum) {
      await purgeExamPartition(container, examId);
      await seedExamPartition(container, examId, questions, checksum);
    } else if (meta && meta.checksum === checksum && !meta.updatedAt) {
      // Backfill updatedAt for old meta docs
      await writeMeta(container, examId, checksum);
    }
  } catch (err) {
    console.warn("ensureExamSynced failed:", err);
  }
};

export const CombinedQuestionsDataSource = () => {
  return {
    async getQuestion(id: string, link: string) {
      try {
        const examId = extractExamId(link);
        const questionsContainer = await getQuestionsContainer();

        // Ensure the partition is up to date with source content
        await ensureExamSynced(questionsContainer, examId, link);

        // Try Cosmos DB first (most efficient)
        const querySpec = {
          query: "SELECT * FROM c WHERE c.id = @id AND c.examId = @examId",
          parameters: [
            { name: "@id", value: id },
            { name: "@examId", value: examId },
          ],
        };
        const { resources: items } = await questionsContainer.items
          .query(querySpec)
          .fetchAll();

        if (items.length > 0) {
          return items[0];
        }

        // Fallback to GitHub if not found in database
        const questions = await fetchQuestions(link);
        if (questions) {
          const question = questions.find((q: any) => q.id === id);
          if (question) {
            // Add examId to the question document and upload to database
            const questionWithExamId = {
              ...question,
              examId: examId,
            };

            try {
              await questionsContainer.items.upsert(questionWithExamId);
            } catch (err) {
              console.warn("Failed to upload question to Cosmos DB:", err);
            }
            return question;
          }
        }

        return null;
      } catch (err) {
        throw new Error("Error fetching question: " + err);
      }
    },

    async getQuestions(link: string) {
      try {
        const examId = extractExamId(link);
        const questionsContainer = await getQuestionsContainer();

        await ensureExamSynced(questionsContainer, examId, link);

        // Try Cosmos DB first
        const querySpec = {
          query: "SELECT VALUE COUNT(c.id) FROM c WHERE c.examId = @examId",
          parameters: [{ name: "@examId", value: examId }],
        };
        const { resources: items } = await questionsContainer.items
          .query(querySpec)
          .fetchAll();

        if (items[0] > 0) {
          return { count: items[0] };
        }

        // Fallback to GitHub if no questions found in database
        const questions = await fetchQuestions(link);
        if (questions) {
          // Upload all questions to database (only if they don't exist)
          try {
            for (const question of questions) {
              const questionWithExamId = {
                ...question,
                examId: examId,
              };
              await questionsContainer.items.upsert(questionWithExamId);
            }
          } catch (err) {
            console.warn("Failed to upload questions to Cosmos DB:", err);
          }
          return { count: questions.length };
        }

        return { count: 0 };
      } catch (err) {
        throw new Error("Error fetching questions: " + err);
      }
    },

    async getRandomQuestions(range: number, link: string) {
      try {
        const examId = extractExamId(link);
        const questionsContainer = await getQuestionsContainer();

        await ensureExamSynced(questionsContainer, examId, link);

        // Try Cosmos DB first
        const querySpec = {
          query: "SELECT * FROM c WHERE c.examId = @examId",
          parameters: [{ name: "@examId", value: examId }],
        };
        const { resources: items } = await questionsContainer.items
          .query(querySpec)
          .fetchAll();

        if (items.length > 0) {
          // Questions exist in database, return random selection
          const shuffled = [...items].sort(() => 0.5 - Math.random());
          return shuffled.slice(0, range);
        }

        // Fallback to GitHub if no questions found in database
        const questions = await fetchQuestions(link);
        if (questions) {
          const shuffled = [...questions].sort(() => 0.5 - Math.random());
          const selected = shuffled.slice(0, range);

          // Upload selected questions to database (only if they don't exist)
          try {
            for (const question of selected) {
              const questionWithExamId = {
                ...question,
                examId: examId,
              };
              await questionsContainer.items.upsert(questionWithExamId);
            }
          } catch (err) {
            console.warn("Failed to upload questions to Cosmos DB:", err);
          }

          return selected;
        }

        return [];
      } catch (err) {
        throw new Error("Error fetching random questions: " + err);
      }
    },
  };
};
