"use client";

import { type FC, useState, useEffect } from "react";
import { useForm, FieldValues } from "react-hook-form";
import { Props } from "./types";
import Image from "next/image";
import SelectionInput from "./SelectionInput";
import { Button } from "./Button";
import NumberInputComponent from "./NumberInputComponent";
import LoadingIndicator from "./LoadingIndicator";
import { SiHelpdesk } from "react-icons/si";
import { useAuth } from "../contexts/AuthContext";
import MarkdownRenderer from "./MarkdownRenderer";

const QuizForm: FC<Props> = ({
  isLoading,
  questionSet,
  handleNextQuestion,
  currentQuestionIndex,
  totalQuestions,
  link,
}) => {
  const { register, handleSubmit, reset, watch } = useForm();
  const { user } = useAuth();

  const [showCorrectAnswer, setShowCorrectAnswer] = useState<boolean>(false);
  const [lastIndex, setLastIndex] = useState<number>(1);
  const [canGoBack, setCanGoBack] = useState<boolean>(false);
  const [savedAnswers, setSavedAnswers] = useState<{
    [key: number]: string | string[];
  }>({});

  const [checkedAnswers, setCheckedAnswers] = useState<{
    [key: number]: string[];
  }>({});

  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    alt: string;
  } | null>(null);

  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [explanationAvailable, setExplanationAvailable] =
    useState<boolean>(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explanationError, setExplanationError] = useState<string | null>(null);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedImage(null);
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [setSelectedImage]);

  const handleClickOutside = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    if (event.target === event.currentTarget) {
      setSelectedImage(null);
    }
  };

  useEffect(() => {
    const checkExplanationAvailability = async () => {
      try {
        if (!user?.email) {
          setExplanationAvailable(false);
          return;
        }

        // Check if user has any explanation capability
        const params = new URLSearchParams({
          email: user.email,
          ...(user.$id && { userId: user.$id }),
        });
        const response = await fetch(`/api/profile?${params.toString()}`);
        if (response.ok) {
          const profile = await response.json();
          const hasExplanationAccess = ["local", "byok", "ditectrev"].includes(
            profile.subscription,
          );
          setExplanationAvailable(hasExplanationAccess);
        }
      } catch (error) {
        console.error("Error checking explanation availability:", error);
      }
    };

    checkExplanationAvailability();
  }, [user?.email, user?.$id]);

  // Clear explanation and reset form when question changes (Bug 1 & navigation fix)
  useEffect(() => {
    setExplanation(null);
    setExplanationError(null);
    setIsThinking(false); // Reset thinking state when question changes
    // Reset form to clear any selected options from previous question
    reset();
    // Reset showCorrectAnswer based on whether we've answered this question before
    const hasAnswered = savedAnswers[currentQuestionIndex] !== undefined;
    setShowCorrectAnswer(hasAnswered);
  }, [currentQuestionIndex, reset, savedAnswers]);

  const isOptionChecked = (optionText: string): boolean | undefined => {
    const savedAnswer = savedAnswers[currentQuestionIndex];
    if (savedAnswer === null) {
      return undefined;
    }
    if (typeof savedAnswer === "string") {
      return savedAnswer === optionText;
    }
    if (Array.isArray(savedAnswer)) {
      return savedAnswer.includes(optionText);
    }
  };

  const explainCorrectAnswer = async () => {
    try {
      setExplanationError(null);

      if (!user?.$id) {
        throw new Error("Please log in to use AI explanations");
      }

      const correctAnswers = options
        .filter((o) => o.isAnswer === true)
        .map((o) => o.text);

      const response = await fetch("/api/explanations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          correctAnswers,
          userId: user.$id,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.error || `HTTP error! Status: ${response.status}`,
        );
      }

      if (responseData && responseData.explanation) {
        setExplanation(responseData.explanation);
      } else {
        throw new Error("No explanation received");
      }
    } catch (error) {
      console.error("Error fetching explanation:", error);
      setExplanationError(
        error instanceof Error
          ? error.message
          : "Failed to generate explanation",
      );
    } finally {
      setIsThinking(false);
    }
  };

  if (isLoading) return <LoadingIndicator />;

  if (!questionSet) {
    // Check if we're trying to load a question beyond the available range
    if (currentQuestionIndex > totalQuestions) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
          <div className="text-center">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                🎉 Practice Complete!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">
                You&apos;ve completed all {totalQuestions} questions in this
                practice session.
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => (window.location.href = "/")}
                className="w-full sm:w-auto bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 cursor-pointer"
              >
                🏠 Return to Home
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 ml-0 sm:ml-4 cursor-pointer"
              >
                🔄 Start Over
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-red-500 text-lg font-semibold">
          Oops! Something went wrong while loading the questions.
        </p>
        <p className="text-white text-md mt-2">
          Please try refreshing the page or check your internet connection.
        </p>
        <p className="text-gray-400 text-sm mt-2">
          Debug: Question {currentQuestionIndex} of {totalQuestions}
        </p>
      </div>
    );
  }

  const { question, options, images } = questionSet!;
  const watchInput = watch(`options.${currentQuestionIndex}`);

  const onSubmit = (data: FieldValues) => {
    setSavedAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: watchInput,
    }));
    setShowCorrectAnswer(true);
    setCanGoBack(true);
    reset();
  };

  const noOfAnswers = options.filter((el) => el.isAnswer === true).length;
  return (
    <form key={currentQuestionIndex} onSubmit={handleSubmit(onSubmit)}>
      <div className="relative min-h-40">
        <div className="flex justify-center ">
          <button
            type="button"
            onClick={() => {
              reset();
              handleNextQuestion(currentQuestionIndex - 1);
            }}
            disabled={!(currentQuestionIndex > 1) || !canGoBack}
            className="group cursor-pointer disabled:cursor-not-allowed"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-gray-500 dark:text-slate-300 group-disabled:text-transparent"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
          </button>
          <div className="flex justify-center relative w-[15%] z-[1]">
            <span className="absolute text-gray-400 dark:text-white opacity-20 dark:opacity-10 font-bold text-6xl bottom-0 -z-[1] select-none">
              Q&A
            </span>
            <NumberInputComponent
              totalQuestions={totalQuestions}
              currentQuestionIndex={currentQuestionIndex}
              handleNextQuestion={handleNextQuestion}
            />
            <p className="text-gray-900 dark:text-white text-md font-semibold text-center w-[40px] rounded-r-md border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
              {totalQuestions}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              reset();
              handleNextQuestion(currentQuestionIndex + 1);
            }}
            disabled={!(currentQuestionIndex < lastIndex)}
            className="group cursor-pointer disabled:cursor-not-allowed"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-gray-500 dark:text-slate-300 group-disabled:text-transparent"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </button>
        </div>
        <div
          className="text-gray-900 dark:text-white md:px-12 pt-10 pb-5 select-none"
          suppressHydrationWarning
        >
          <MarkdownRenderer variant="question">{question}</MarkdownRenderer>
        </div>
        {images && (
          <ul className="flex flex-row justify-center gap-2 mt-5 mb-8 select-none md:px-12 px-0">
            {images.map((image) => (
              <li
                key={image.alt}
                className="w-[60px] h-[60px] rounded-md border border-gray-200 dark:border-gray-600 overflow-hidden flex flex-row justify-center hover:border-primary-500 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer"
                onClick={() => setSelectedImage(image)}
              >
                <Image
                  src={link + image.url}
                  alt={image.alt}
                  className="max-h-max max-w-max hover:opacity-60"
                  unoptimized
                  width={200}
                  height={200}
                />
              </li>
            ))}
          </ul>
        )}
        {selectedImage && (
          <div
            onClick={handleClickOutside}
            className="fixed top-0 left-0 z-50 w-full h-full flex justify-center items-center bg-black/30 backdrop-blur-sm"
          >
            <Image
              src={link + selectedImage.url}
              alt={selectedImage.alt}
              className="max-w-[90%] max-h-[90%]"
              width={800}
              height={600}
              unoptimized
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-3 right-5 px-3 py-1 bg-white text-black rounded-md cursor-pointer"
            >
              Close
            </button>
          </div>
        )}
      </div>
      <ul className="flex flex-col gap-2 mt-5 mb-16 select-none md:px-12 px-0 h-max min-h-[250px]">
        {options.map((option, index) => (
          <li key={`${currentQuestionIndex}-${index}`}>
            <SelectionInput
              {...register(`options.${currentQuestionIndex}`)}
              index={`${currentQuestionIndex}.${index}`}
              type={noOfAnswers > 1 ? "checkbox" : "radio"}
              label={option.text}
              isAnswer={option.isAnswer}
              showCorrectAnswer={showCorrectAnswer}
              disabled={showCorrectAnswer}
              defaultChecked={isOptionChecked(option.text)}
            />
          </li>
        ))}
      </ul>
      {(explanation || explanationError) && (
        <div className="md:px-12 mb-16">
          <div
            className={`border rounded-lg p-6 shadow-lg ${
              explanationError
                ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                : "bg-blue-50 dark:bg-slate-800 border-blue-200 dark:border-slate-600"
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full flex items-center justify-center">
                {/* @ts-ignore - react-icons types incompatible with React 18.3 strict types */}
                <SiHelpdesk
                  className={`w-5 h-5 ${
                    explanationError
                      ? "text-red-500"
                      : "text-blue-600 dark:text-white"
                  }`}
                />
              </div>
              <h3
                className={`text-lg font-semibold ${
                  explanationError
                    ? "text-red-700 dark:text-red-300"
                    : "text-blue-900 dark:text-white"
                }`}
              >
                {explanationError ? "Explanation Error" : "Explanation"}
              </h3>
            </div>
            <div
              className={`leading-relaxed overflow-visible ${
                explanationError
                  ? "text-red-700 dark:text-red-300"
                  : "text-blue-900 dark:text-slate-200"
              }`}
              suppressHydrationWarning
            >
              {explanationError ? (
                <p>{explanationError}</p>
              ) : (
                <MarkdownRenderer variant="explanation">
                  {explanation || ""}
                </MarkdownRenderer>
              )}
            </div>
            {explanationError && (
              <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">
                  Try checking your profile settings or upgrading your plan for
                  explanation access.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="flex justify-center flex-col sm:flex-row">
        <Button
          type="submit"
          intent="secondary"
          size="medium"
          disabled={showCorrectAnswer}
        >
          Reveal Answer
        </Button>
        {explanationAvailable && (
          <Button
            type="button"
            intent="secondary"
            size="medium"
            variant="outlined"
            disabled={isThinking}
            onClick={async () => {
              setShowCorrectAnswer(true);
              setIsThinking(true);
              // Save current answer if any is selected before explaining
              if (watchInput) {
                setSavedAnswers((prev) => ({
                  ...prev,
                  [currentQuestionIndex]: watchInput,
                }));
              }
              // Update lastIndex to enable "Next Question" button
              if (currentQuestionIndex >= lastIndex) {
                setLastIndex(currentQuestionIndex);
              }
              await explainCorrectAnswer();
              reset();
            }}
          >
            {isThinking ? "Thinking..." : "Explain"}
          </Button>
        )}
        {currentQuestionIndex < totalQuestions ? (
          <Button
            type="button"
            intent="primary"
            size="medium"
            disabled={currentQuestionIndex < lastIndex && !showCorrectAnswer}
            onClick={() => {
              // Save answer if not already saved
              if (!showCorrectAnswer) {
                setSavedAnswers((prev) => ({
                  ...prev,
                  [currentQuestionIndex]: watchInput,
                }));
              }
              setShowCorrectAnswer(false);
              setExplanation(null);
              setExplanationError(null);
              setIsThinking(false); // Reset thinking state when navigating
              // Only navigate if we're not on the last question
              if (currentQuestionIndex < totalQuestions) {
                handleNextQuestion(currentQuestionIndex + 1);
                setLastIndex(currentQuestionIndex + 1);
              }
              setCanGoBack(false);
              reset();
            }}
          >
            Next Question
          </Button>
        ) : (
          <Button
            type="button"
            intent="primary"
            size="medium"
            onClick={() => {
              window.location.href = "/";
            }}
          >
            Go Home
          </Button>
        )}
      </div>
    </form>
  );
};

export default QuizForm;
