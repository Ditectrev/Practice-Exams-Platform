"use client";

import { useState } from "react";
import type { NextPage } from "next";
import ExamLink from "@azure-fundamentals/components/ExamLink";

const Modes: NextPage<{ searchParams: { url: string; name: string } }> = ({
  searchParams,
}) => {
  const { url, name } = searchParams;
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

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
