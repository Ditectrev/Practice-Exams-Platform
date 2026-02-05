import { test, expect } from "@playwright/test";

test("Application should have correct initial state", async ({ page }) => {
  await page.goto("");
  expect(await page.getByRole("main").getByRole("link").all()).toHaveLength(34);
  await expect(page.getByRole("main").getByRole("heading").first()).toHaveText(
    /Welcome/,
  );

  await expect(page.locator(".text-xl").first()).toHaveText(
    "🧪 Practice Tests Exams Platform",
  );
  await expect(page.locator(".text-lg").last()).toHaveText(
    "Select an exam from the list bellow.",
  );

  const examHeaders = [
    "AWS Certified ANS-C01",
    "AWS Certified CLF-C02",
    "AWS Certified DAS-C01",
    "AWS Certified DBS-C01",
    "AWS Certified DVA-C02",
    "AWS Certified MLS-C01",
    "AWS Certified SAA-C03",
    "AWS Certified SCS-C02",
    "GCP ACE",
    "ITIL 4 Foundation",
    "Microsoft Azure AZ-104",
    "Microsoft Azure AZ-204",
    "Microsoft Azure AZ-305",
    "Microsoft Azure AZ-400",
    "Microsoft Azure AZ-500",
    "Microsoft Azure AZ-800",
    "Microsoft Azure AZ-900",
    "Microsoft Azure SC-900",
    "PSD I",
    "PSM I",
    "PSM II",
    "PSPO I",
  ];

  const examParagraphs = [
    "AWS Certified Advanced Networking Specialty",
    "AWS Certified Cloud Practitioner",
    "AWS Certified Data Analytics Specialty",
    "AWS Certified Database Specialty",
    "AWS Certified Developer Associate",
    "AWS Certified Machine Learning Specialty",
    "AWS Certified Solutions Architect Associate",
    "AWS Certified Security Specialty",
    "GCP Associate Cloud Engineer",
    "IT Service Management",
    "Microsoft Azure Administrator",
    "Developing Solutions for Azure",
    "Designing Microsoft Azure Infrastructure Solutions",
    "Designing and Implementing Microsoft DevOps Solutions",
    "Azure Security Engineer",
    "Windows Server Hybrid Administrator",
    "Microsoft Azure Fundamentals",
    "Microsoft Security, Compliance, and Identity Fundamentals",
    "Scrum Developer I for PSD I",
    "Scrum Master I for PSM I",
    "Scrum Master II for PSM II",
    "Scrum Product Owner I for PSPO I",
  ];

  let index = 0;
  for (const link of await page.getByRole("main").getByRole("link").all()) {
    await expect(link.locator("h2")).toHaveText(examHeaders[index]);
    await expect(link.locator("p")).toHaveText(examParagraphs[index++]);
  }
});

test("Practice should work properly", async ({ page }) => {
  await page.goto("");
  await page.getByRole("link", { name: "AWS Certified ANS-C01 AWS" }).click();

  await expect(
    page.getByRole("heading", { name: "AWS Certified ANS-C01" }),
  ).toBeVisible();
  await expect(
    page.locator("main").getByRole("link").first().locator("h2"),
  ).toHaveText("Practice mode");
  await expect(
    page.locator("main").getByRole("link").last().locator("h2"),
  ).toHaveText("Exam mode");
  expect(await page.locator("main").getByRole("link").all()).toHaveLength(2);

  await page.locator("main").getByRole("link").last().click();
  await expect(page.locator("main").locator("h1")).toContainText(
    "PRACTICE EXAM",
  );
  await expect(
    page.locator("main").locator("p", { hasText: "15:00" }),
  ).toBeVisible();

  const startButton = page.getByRole("button", { name: "Begin exam" });
  await expect(startButton).toBeEnabled();
  await startButton.click();

  await expect(
    page.locator("button").filter({ hasText: "Next Question" }),
  ).not.toBeEnabled();

  const skipQuestion = page
    .locator("button")
    .filter({ hasText: "Skip Question" });
  await expect(skipQuestion).toBeEnabled();
  await skipQuestion.click();

  await page.getByRole("button").first().click();

  await page.getByRole("link", { name: "AWS Certified CLF-C02 AWS" }).click();
  await page.getByRole("link", { name: "Practice mode Learn and" }).click();

  await expect(page.locator("input[type=number]")).toHaveValue("1");
  await expect(page.getByText("597")).toBeVisible();
  expect(await page.locator("label").all()).toHaveLength(4);
  await page.locator("label").first().click();
  await page.getByRole("button", { name: "Reveal Answer" }).click();
  await expect(page.locator("main ul")).toHaveScreenshot({ threshold: 0.02 });

  await page.getByRole("button", { name: "Next Question" }).click();
  await expect(page.locator("input[type=number]")).toHaveValue("2");
  await page.locator("label").last().click();
  await page.getByRole("button", { name: "Reveal Answer" }).click();
  await expect(page.locator("main ul")).toHaveScreenshot({ threshold: 0.02 });
});
