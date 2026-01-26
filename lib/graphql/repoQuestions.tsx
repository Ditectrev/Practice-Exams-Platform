import { createHash } from "crypto";
const scrapeQuestions = (markdownText: string) => {
  const regex =
    /### (.*?)\s*\r?\n\r?\n((?:\!\[.*?\]\(.*?\)\s*\r?\n\r?\n)*?)((?:- \[(?:x| )\] .*?\r?\n)+)/gs;

  const optionsRegex = /- \[(x| )\] (.*?)(?=\r?\n- \[|$)/g;
  const imageRegex = /\!\[(.*?)\]\((.*?)\)/g;
  const questions = [];
  let match;
  let id = 0;

  while ((match = regex.exec(markdownText)) !== null) {
    const question = match[1].trim();
    const imagesText = match[2].trim();
    const optionsText = match[3].trim();

    const images = [];
    let imageMatch;

    while ((imageMatch = imageRegex.exec(imagesText)) !== null) {
      const altText = imageMatch[1].trim();
      const imageUrl = imageMatch[2].trim();
      images.push({ alt: altText, url: imageUrl });
    }

    let optionMatch;
    const options = [];

    while ((optionMatch = optionsRegex.exec(optionsText)) !== null) {
      const isAnswer = optionMatch[1].trim() === "x";
      const optionText = optionMatch[2].trim();
      options.push({ text: optionText, isAnswer });
    }

    questions.push({
      id: id.toString(),
      question,
      images,
      options,
    });

    id++;
  }

  return questions;
};

export const fetchQuestions = async (link: string) => {
  try {
    const res = await fetch(link, {
      headers: {
        "User-Agent": "Practice-Exams-Platform/1.0",
        Accept: "text/plain, text/markdown, */*",
      },
    });
    if (!res.ok) {
      const errorText = await res.text().catch(() => res.statusText);
      throw new Error(
        `Failed to fetch ${link}: ${res.status} ${
          res.statusText
        }. Response: ${errorText.substring(0, 200)}`,
      );
    }

    const contentType = res.headers.get("content-type");
    const markdown = await res.text();

    // Check if we got HTML instead of markdown (GitHub error page)
    if (
      markdown.trim().startsWith("<!DOCTYPE") ||
      markdown.trim().startsWith("<html")
    ) {
      throw new Error(
        `Received HTML instead of markdown from ${link}. Response starts with: ${markdown.substring(
          0,
          100,
        )}`,
      );
    }

    // Check content type
    if (
      contentType &&
      !contentType.includes("text/plain") &&
      !contentType.includes("text/markdown") &&
      !contentType.includes("text/html")
    ) {
      console.warn(`Unexpected content-type: ${contentType} for ${link}`);
    }

    return scrapeQuestions(markdown);
  } catch (err: any) {
    console.error("fetchQuestions error:", err.message);
    throw err; // Re-throw so GraphQL can handle it properly
  }
};

export const fetchQuestionsAndChecksum = async (
  link: string,
): Promise<{ questions: any[]; checksum: string } | undefined> => {
  try {
    const res = await fetch(link, {
      headers: {
        "User-Agent": "Practice-Exams-Platform/1.0",
        Accept: "text/plain, text/markdown, */*",
      },
    });
    if (!res.ok) {
      const errorText = await res.text().catch(() => res.statusText);
      throw new Error(
        `Failed to fetch ${link}: ${res.status} ${
          res.statusText
        }. Response: ${errorText.substring(0, 200)}`,
      );
    }

    const contentType = res.headers.get("content-type");
    const markdown = await res.text();

    // Check if we got HTML instead of markdown (GitHub error page)
    if (
      markdown.trim().startsWith("<!DOCTYPE") ||
      markdown.trim().startsWith("<html")
    ) {
      throw new Error(
        `Received HTML instead of markdown from ${link}. Response starts with: ${markdown.substring(
          0,
          100,
        )}`,
      );
    }

    const questions = scrapeQuestions(markdown);
    const checksum = createHash("sha256").update(markdown).digest("hex");
    return { questions, checksum };
  } catch (err: any) {
    console.error("fetchQuestionsAndChecksum error:", err.message);
    throw err; // Re-throw so GraphQL can handle it properly
  }
};
