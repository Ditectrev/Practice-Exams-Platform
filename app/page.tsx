"use client";

import { useState } from "react";
import type { NextPage } from "next";
import NameLink from "@practice-tests-exams-platform/components/NameLink";
import exams from "@practice-tests-exams-platform/lib/exams.json";
import useDebounce from "@practice-tests-exams-platform/hooks/useDebounce";

const Home: NextPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const filteredExams = exams.filter((exam) =>
    exam.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()),
  );

  return (
    <div className="mx-auto mb-6 w-full lg:w-[70vw] 2xl:w-[45%] text-center px-6 pr-8 sm:px-8 sm:pr-12 lg:px-12 lg:pr-16">
      <h2 className="text-gray-900 dark:text-gray-100 text-5xl font-bold uppercase mt-16">
        Welcome!
      </h2>
      <p className="text-gray-900 dark:text-gray-100 text-lg mt-4 mb-6 leading-6">
        Select an exam from the list below.
      </p>
      <input
        type="text"
        value={searchTerm}
        onChange={handleSearchChange}
        placeholder="Search exams"
        className="mb-6 px-4 py-2 border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md w-3/4 lg:w-1/2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
      />
      <div
        className={`cards-container grid ${
          filteredExams.length > 0
            ? "grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5"
            : "flex justify-center items-center"
        } mx-5 lg:mx-0`}
      >
        {filteredExams.length > 0 ? (
          filteredExams.map((exam) => (
            <div
              key={exam.name}
              onMouseEnter={() => setHoveredCard(exam.name)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <NameLink
                href={{
                  pathname: "/modes",
                  query: { url: exam.url, name: exam.name },
                }}
                heading={exam.name}
                paragraph={exam.subtitle}
                wrapperClassNames={
                  hoveredCard && hoveredCard !== exam.name ? "dimmed" : ""
                }
                headingClassNames=""
              />
            </div>
          ))
        ) : (
          <p className="text-gray-900 dark:text-gray-100 text-lg mt-4">
            No exams were found for your query.
          </p>
        )}
      </div>
    </div>
  );
};

export default Home;
