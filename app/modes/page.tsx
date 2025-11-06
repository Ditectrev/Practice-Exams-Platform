"use client";

import { useState, useEffect } from "react";
import type { NextPage } from "next";
import ExamLink from "@azure-fundamentals/components/ExamLink";

const Modes: NextPage = () => {
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(
    null,
  );
  const url = searchParams?.get("url") || "";
  const name = searchParams?.get("name") || "";
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => {
    const param = new URLSearchParams(window.location.search);
    setSearchParams(param);
  }, []);

  // Show loading while waiting for URL
  if (!searchParams) {
    return (
      <div className="mx-auto mb-6 w-full lg:w-[70vw] 2xl:w-[45%] text-center px-6 pr-8 sm:px-8 sm:pr-12 lg:px-12 lg:pr-16 modes-page">
        <div className="text-gray-900 dark:text-gray-100 text-4xl text-leading font-bold uppercase mt-16">
          Loading...
        </div>
      </div>
    );
  }

  // Check if URL or name is missing
  if (!url || !name) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
        <div className="mx-auto w-full lg:w-[70vw] 2xl:w-[45%] text-center px-6 pr-8 sm:px-8 sm:pr-12 lg:px-12 lg:pr-16 modes-page">
          <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg py-10 px-5 sm:p-10">
            <div className="text-red-500 dark:text-red-400 text-lg mb-4">
              ⚠️ Exam information is missing. Please select an exam from the
              home page.
            </div>
            <button
              onClick={() => (window.location.href = "/")}
              className="btn-primary text-white px-6 py-2 rounded-lg"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto mb-6 w-full lg:w-[70vw] 2xl:w-[45%] text-center px-6 pr-8 sm:px-8 sm:pr-12 lg:px-12 lg:pr-16 modes-page">
      <h2 className="text-gray-900 dark:text-gray-100 text-4xl text-leading font-bold uppercase mt-16">
        {name}
      </h2>
      <p className="text-gray-900 dark:text-gray-100 text-lg mt-4 mb-6 leading-6">
        Test your knowledge under pressure with our timed exam mode or explore
        and master all the questions at your own pace with our practice mode.
      </p>
      <div className="cards-container grid grid-cols-1 md:grid-cols-2 gap-5">
        <div
          onMouseEnter={() => setHoveredCard("practice")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <ExamLink
            href={{
              pathname: "/practice",
              query: { url, name },
            }}
            heading="Practice mode"
            paragraph="Learn and familiarize yourself with the questions and answers without any time constraint.<br /><br />You can copy URL to comeback to the same question later."
            wrapperClassNames={
              hoveredCard && hoveredCard !== "practice" ? "dimmed" : ""
            }
          />
        </div>
        <div
          onMouseEnter={() => setHoveredCard("exam")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <ExamLink
            href={{
              pathname: "/exam",
              query: { url, name },
            }}
            heading="Exam mode"
            paragraph="Put your knowledge to the test by answering a fixed number of randomly selected questions under a time
              limit."
            wrapperClassNames={
              hoveredCard && hoveredCard !== "exam" ? "dimmed" : ""
            }
          />
        </div>
      </div>
    </div>
  );
};

export default Modes;
