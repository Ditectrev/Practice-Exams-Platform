"use client";

import { useState, useEffect, useCallback } from "react";
import { gql, useQuery } from "@apollo/client";
import type { NextPage } from "next";
import QuizForm from "@azure-fundamentals/components/QuizForm";
import { useTrialAccess } from "@azure-fundamentals/hooks/useTrialAccess";
import LoadingIndicator from "@azure-fundamentals/components/LoadingIndicator";

const questionQuery = gql`
  query QuestionById($id: ID!, $link: String) {
    questionById(id: $id, link: $link) {
      question
      options {
        isAnswer
        text
      }
      images {
        alt
        url
      }
    }
  }
`;

const questionsQuery = gql`
  query Questions($link: String) {
    questions(link: $link) {
      count
    }
  }
`;

const Practice: NextPage = () => {
  const { isAccessBlocked, isInTrial } = useTrialAccess();
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(
    null,
  );
  const url = searchParams?.get("url") || "";
  const seqParam = searchParams?.get("seq");
  const seq = seqParam ? parseInt(seqParam) : 1;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(seq);
  const editedUrl =
    url && url.includes("/") ? url.substring(0, url.lastIndexOf("/") + 1) : "";

  const { loading, error, data } = useQuery(questionQuery, {
    variables: { id: currentQuestionIndex - 1, link: url },
    skip: !url, // Skip query if URL is not available
  });

  useEffect(() => {
    const param = new URLSearchParams(window.location.search);
    setSearchParams(param);
  }, []);

  const {
    data: questionsData,
    loading: questionsLoading,
    error: questionsError,
  } = useQuery(questionsQuery, {
    variables: { link: url },
    skip: !url, // Skip query if URL is not available
  });

  const setThisSeqIntoURL = useCallback((seq: number) => {
    const newSearchParams = new URLSearchParams(window.location.search);
    newSearchParams.set("seq", seq.toString());
    const newUrl = `${window.location.pathname}?${newSearchParams.toString()}`;
    window.history.replaceState(null, "", newUrl);
  }, []);

  useEffect(() => {
    setCurrentQuestionIndex(seq);
  }, [seq]);

  const handleNextQuestion = (questionNo: number) => {
    // Fix off-by-one error: subtract 1 from the count since it's 1-indexed but count is 0-indexed
    const totalQuestions = Math.max(
      0,
      (questionsData?.questions?.count || 0) - 1,
    );

    // Allow navigation to questions 1 through totalQuestions
    if (questionNo > 0 && questionNo <= totalQuestions) {
      setCurrentQuestionIndex(questionNo);
      setThisSeqIntoURL(questionNo);
    }
  };

  // Show loading while checking trial access or waiting for URL
  if (isAccessBlocked === undefined || !searchParams) {
    return <LoadingIndicator />;
  }

  // Check if URL is missing
  if (!url) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
        <div className="py-10 px-5 sm:p-10 mx-auto w-[90vw] lg:w-[60vw] 2xl:w-[45%] bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg text-center">
          <div className="text-red-500 dark:text-red-400 text-lg mb-4">
            ⚠️ Practice URL is missing. Please select an exam from the home
            page.
          </div>
          <button
            onClick={() => (window.location.href = "/")}
            className="btn-primary text-white px-6 py-2 rounded-lg"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Block access if trial expired
  if (isAccessBlocked) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
        <div className="py-10 px-5 mb-6 sm:p-10 mx-auto w-[90vw] lg:w-[60vw] 2xl:w-[45%] bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg text-center">
          <div className="text-red-500 dark:text-red-400 text-lg mb-4">
            ⏰ Trial expired. Please sign in to continue practicing.
          </div>
          <button
            onClick={() => (window.location.href = "/")}
            className="btn-primary text-white px-6 py-2 rounded-lg"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
        <div className="py-10 px-5 mb-6 sm:p-10 mx-auto w-[90vw] lg:w-[60vw] 2xl:w-[45%] bg-white dark:bg-gray-800 border-2 border-red-200 dark:border-red-700 rounded-lg text-center">
          <div className="text-red-500 dark:text-red-400 text-lg mb-4">
            ⚠️ Error loading question
          </div>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {error.message}
          </p>
          <button
            onClick={() => (window.location.href = "/")}
            className="btn-primary text-white px-6 py-2 rounded-lg"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }
  if (questionsError) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
        <div className="py-10 px-5 mb-6 sm:p-10 mx-auto w-[90vw] lg:w-[60vw] 2xl:w-[45%] bg-white dark:bg-gray-800 border-2 border-red-200 dark:border-red-700 rounded-lg text-center">
          <div className="text-red-500 dark:text-red-400 text-lg mb-4">
            ⚠️ Error loading questions
          </div>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {questionsError.message}
          </p>
          <button
            onClick={() => (window.location.href = "/")}
            className="btn-primary text-white px-6 py-2 rounded-lg"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10 px-5 mb-6 sm:p-10 mx-auto w-[90vw] lg:w-[60vw] 2xl:w-[45%] bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg mt-8">
      {isInTrial && (
        <div className="mb-6 p-4 bg-amber-600/20 border border-amber-600/40 rounded-lg">
          <div className="flex items-center gap-2 text-amber-300">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-medium">
              Trial Mode - Sign in to unlock unlimited access
            </span>
          </div>
        </div>
      )}
      <QuizForm
        isLoading={loading || questionsLoading}
        questionSet={data?.questionById}
        handleNextQuestion={handleNextQuestion}
        totalQuestions={Math.max(0, (questionsData?.questions?.count || 0) - 1)}
        currentQuestionIndex={currentQuestionIndex}
        link={editedUrl}
      />
    </div>
  );
};

export default Practice;
