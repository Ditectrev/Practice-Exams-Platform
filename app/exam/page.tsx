"use client";

import { useEffect, useState } from "react";
import type { NextPage } from "next";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import useTimer from "@practice-tests-exams-platform/hooks/useTimer";
import { Button } from "@practice-tests-exams-platform/components/Button";
import QuizExamForm from "@practice-tests-exams-platform/components/QuizExamFormUF";
import { Question } from "@practice-tests-exams-platform/components/types";
import ExamResult from "@practice-tests-exams-platform/components/ExamResult";
import LoadingIndicator from "@practice-tests-exams-platform/components/LoadingIndicator";
import { useTrialAccess } from "@practice-tests-exams-platform/hooks/useTrialAccess";

const questionsQuery = gql`
  query RandomQuestions($range: Int!, $link: String) {
    randomQuestions(range: $range, link: $link) {
      question
      options {
        isAnswer
        text
      }
      images {
        url
        alt
      }
    }
  }
`;

type RandomQuestionsData = {
  randomQuestions: Question[];
};

const Exam: NextPage = () => {
  const { isAccessBlocked, isInTrial } = useTrialAccess();
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(
    null,
  );
  const url = searchParams?.get("url") || "";
  const { data, loading, error } = useQuery<RandomQuestionsData>(
    questionsQuery,
    {
      variables: { range: 30, link: url },
      skip: !url, // Skip query if URL is not available
    },
  );
  // Calculate timer: 2 minutes per question (30 questions = 60 minutes)
  const examQuestionCount = 30; // Fixed number of questions in exam mode
  const minutesPerQuestion = 2;
  const { minutes, seconds } = {
    minutes: examQuestionCount * minutesPerQuestion,
    seconds: 0,
  };
  const totalTimeInSeconds = minutes * 60 + seconds;
  const { remainingTime, startTimer, stopTimer, isRunning, isFinished } =
    useTimer({ minutes: minutes, seconds: seconds });
  const [currentQuestion, setCurrentQuestion] = useState<Question>();
  const [revealExam, setRevealExam] = useState<boolean>(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [countAnswered, setCountAnswered] = useState<number>(0);
  const [resultPoints, setResultPoints] = useState<number>(0);
  const [passed, setPassed] = useState<boolean>(false);
  const [windowWidth, setWindowWidth] = useState<number>(0);
  const editedUrl =
    url && url.includes("/") ? url.substring(0, url.lastIndexOf("/") + 1) : "";
  const elapsedSeconds =
    totalTimeInSeconds -
    (parseInt(remainingTime.split(":")[0]) * 60 +
      parseInt(remainingTime.split(":")[1]));

  useEffect(() => {
    const param = new URLSearchParams(window.location.search);
    setSearchParams(param);
  }, []);

  const handleCountAnswered = () => {
    setCountAnswered(countAnswered + 1);
  };

  const handleSkipQuestion = (questionNo: number) => {
    setCurrentQuestionIndex(questionNo);
    setCurrentQuestion(data?.randomQuestions[questionNo]);
  };

  const handleNextQuestion = (questionNo: number) => {
    setCurrentQuestionIndex(questionNo);
    setCurrentQuestion(data?.randomQuestions[questionNo]);
  };

  const getResultPoints = (points: number) => {
    const maxPoints = data?.randomQuestions?.length ?? 1;
    const percentage = Math.round((points / maxPoints) * 10000) / 100;
    if (percentage >= 75) {
      setPassed(true);
    } else {
      setPassed(false);
    }

    setResultPoints(percentage);
  };

  useEffect(() => {
    setWindowWidth(window.innerWidth);
  }, []);

  useEffect(() => {
    setCurrentQuestion(data?.randomQuestions[0]);
  }, [data]);

  // Show loading while checking trial access or waiting for URL
  if (isAccessBlocked === undefined || !searchParams) {
    return <LoadingIndicator />;
  }

  // Check if URL is missing
  if (!url) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
        <div className="py-10 px-5 mb-6 mx-auto w-[90vw] lg:w-[60vw] 2xl:w-[45%] bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg text-center">
          <div className="text-red-500 dark:text-red-400 text-lg mb-4">
            ⚠️ Exam URL is missing. Please select an exam from the home page.
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
        <div className="py-10 px-5 mb-6 mx-auto w-[90vw] lg:w-[60vw] 2xl:w-[45%] bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg text-center">
          <div className="text-red-500 dark:text-red-400 text-lg mb-4">
            ⏰ Trial expired. Please sign in to continue taking exams.
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

  if (loading) return <LoadingIndicator />;
  if (error) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
        <div className="py-10 px-5 mb-6 mx-auto w-[90vw] lg:w-[60vw] 2xl:w-[45%] bg-white dark:bg-gray-800 border-2 border-red-200 dark:border-red-700 rounded-lg text-center">
          <div className="text-red-500 dark:text-red-400 text-lg mb-4">
            ⚠️ Error loading exam questions
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

  if (!data?.randomQuestions || data.randomQuestions.length === 0) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
        <div className="py-10 px-5 mb-6 mx-auto w-[90vw] lg:w-[60vw] 2xl:w-[45%] bg-white dark:bg-gray-800 border-2 border-yellow-200 dark:border-yellow-700 rounded-lg text-center">
          <div className="text-yellow-600 dark:text-yellow-400 text-lg mb-4">
            ⚠️ No questions found for this exam
          </div>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            The exam questions could not be loaded. Please try again later or
            select a different exam.
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

  const numberOfQuestions = data.randomQuestions.length || 0;

  return (
    <div className="py-10 px-5 mb-6 mx-auto w-[90vw] lg:w-[60vw] 2xl:w-[45%] bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg mt-8">
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
      <div>
        <div className="px-2 sm:px-10 w-full flex flex-row justify-between items-center">
          <p className="text-gray-900 dark:text-white font-bold text-sm sm:text-2xl">
            ✅ {countAnswered}/{numberOfQuestions}
          </p>
          <h1 className="text-gray-900 dark:text-white font-bold text-lg sm:text-3xl">
            PRACTICE EXAM
          </h1>
          <p className="text-gray-900 dark:text-white font-bold text-sm sm:text-2xl">
            {remainingTime}
          </p>
        </div>
        {!isRunning && isFinished && !revealExam && (
          <ExamResult
            status={passed}
            points={resultPoints}
            elapsedSeconds={elapsedSeconds}
            setRevealExam={setRevealExam}
          />
        )}
        <div
          className={`${
            (isRunning && !isFinished) || revealExam ? "" : "hidden"
          }`}
        >
          <div className="h-max">
            <QuizExamForm
              remainingTime={remainingTime}
              isLoading={loading}
              handleCountAnswered={handleCountAnswered}
              handleSkipQuestion={handleSkipQuestion}
              handleNextQuestion={handleNextQuestion}
              totalQuestions={data.randomQuestions?.length}
              currentQuestionIndex={currentQuestionIndex}
              question={currentQuestion?.question ?? ""}
              options={currentQuestion?.options ?? []}
              images={currentQuestion?.images}
              stopTimer={stopTimer}
              revealExam={revealExam}
              getResultPoints={getResultPoints}
              questions={data.randomQuestions}
              hideExam={() => {
                setRevealExam(false);
              }}
              link={editedUrl}
            />
          </div>
        </div>
        {!isRunning && !isFinished && !revealExam && (
          <div>
            <div className="h-max">
              <div className="grid pt-20 place-items-center">
                <svg width="40" height="40" viewBox="0 0 40 40">
                  <path
                    fill="#FFFFFF"
                    d="M20,0C8.96,0,0,8.96,0,20c0,11.05,8.96,20,20,20s20-8.95,20-20C40,8.96,31.04,0,20,0z M20,8.87
                c1.87,0,3.39,1.52,3.39,3.39s-1.52,3.39-3.39,3.39s-3.39-1.52-3.39-3.39S18.13,8.87,20,8.87z M24.52,29.35
                c0,0.53-0.43,0.97-0.97,0.97h-7.1c-0.53,0-0.97-0.43-0.97-0.97v-1.94c0-0.53,0.43-0.97,0.97-0.97h0.97v-5.16h-0.97
                c-0.53,0-0.97-0.43-0.97-0.97v-1.94c0-0.53,0.43-0.97,0.97-0.97h5.16c0.53,0,0.97,0.43,0.97,0.97v8.06h0.97
                c0.53,0,0.97,0.43,0.97,0.97V29.35z"
                  />
                </svg>
                <p className="text-gray-900 dark:text-white text-center pt-6 px-6">
                  Practice Exam help you practice skills, assess your knowledge,
                  and identify the areas where you need additional preparation
                  to accelerate your chances of succeeding on certification
                  exams. Practice Exams are intended to provide an overview of
                  the style, wording, and difficulty of the questions that you
                  are likely to experience on Azure Fundamentals real exam.
                </p>
              </div>
              <p className="text-gray-900 dark:text-white font-bold text-xl text-center pt-20 px-6 mb-40">
                This Practice Exam contains {numberOfQuestions} random questions
                (seen in upper left corner) and has a completion time limit of{" "}
                {remainingTime.split(":")[0]} minutes (seen in upper right
                corner).
              </p>
            </div>
            <div className="flex flex-col sm:flex-row justify-center">
              <Button
                type="button"
                intent="primary"
                size="medium"
                onClick={() => startTimer()}
              >
                Begin exam
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Exam;
