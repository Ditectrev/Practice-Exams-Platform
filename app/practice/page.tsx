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
  const editedUrl = url.substring(0, url.lastIndexOf("/") + 1);

  const { loading, error, data } = useQuery(questionQuery, {
    variables: { id: currentQuestionIndex - 1, link: url },
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
    if (questionNo > 0 && questionNo - 1 < questionsData?.questions?.count) {
      setCurrentQuestionIndex(questionNo);
      setThisSeqIntoURL(questionNo);
    }
  };

  // Show loading while checking trial access
  if (isAccessBlocked === undefined) {
    return <LoadingIndicator />;
  }

  // Block access if trial expired
  if (isAccessBlocked) {
    return (
      <div className="py-10 px-5 mb-6 sm:p-10 mx-auto w-[90vw] lg:w-[60vw] 2xl:w-[45%] bg-slate-800 border-2 border-slate-700 rounded-lg text-center">
        <div className="text-red-400 text-lg mb-4">
          ⏰ Trial expired. Please sign in to continue practicing.
        </div>
        <button
          onClick={() => (window.location.href = "/")}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Home
        </button>
      </div>
    );
  }

  if (error) return <p>Oh no... {error.message}</p>;
  if (questionsError) return <p>Oh no... {questionsError.message}</p>;

  return (
    <div className="py-10 px-5 mb-6 sm:p-10 mx-auto w-[90vw] lg:w-[60vw] 2xl:w-[45%] bg-slate-800 border-2 border-slate-700 rounded-lg">
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
        totalQuestions={questionsData?.questions?.count}
        currentQuestionIndex={currentQuestionIndex}
        link={editedUrl}
      />
    </div>
  );
};

export default Practice;
