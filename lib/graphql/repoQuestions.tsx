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
    const res = await fetch(link);
    if (!res.ok) {
      throw new Error(res.statusText);
    }
    const markdown = await res.text();

    return scrapeQuestions(markdown);
  } catch (err: any) {
    console.error(err.message);
  }
};

export const fetchQuestionsAndChecksum = async (
  link: string,
): Promise<{ questions: any[]; checksum: string } | undefined> => {
  try {
    const res = await fetch(link);
    if (!res.ok) {
      throw new Error(res.statusText);
    }
    const markdown = await res.text();
    const questions = scrapeQuestions(markdown);
    const checksum = createHash("sha256").update(markdown).digest("hex");
    return { questions, checksum };
  } catch (err: any) {
    console.error(err.message);
  }
};
