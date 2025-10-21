import { type FC, useState, useEffect } from "react";
import { useForm, FieldValues } from "react-hook-form";
import { Props } from "./types";
import Image from "next/image";
import SelectionInput from "./SelectionInput";
import { Button } from "./Button";
import NumberInputComponent from "./NumberInputComponent";
import LoadingIndicator from "./LoadingIndicator";
import { SiHelpdesk } from "react-icons/si";

const QuizForm: FC<Props> = ({
  isLoading,
  questionSet,
  handleNextQuestion,
  currentQuestionIndex,
  totalQuestions,
  link,
}) => {
  const { register, handleSubmit, reset, watch } = useForm();

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
  const [ollamaAvailable, setOllamaAvailable] = useState<boolean>(false);
  const [explanation, setExplanation] = useState<string | null>(null);

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
    const checkOllamaStatus = async () => {
      try {
        const response = await fetch("http://localhost:11434");
        if (response.ok) {
          setOllamaAvailable(true);
        }
      } catch (error) {
        console.error("Error checking server status:", error);
      }
    };

    checkOllamaStatus();
  }, []);

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
      const prompt = `${question} Explain why these answers are correct: ${options
        .filter((o) => o.isAnswer == true)
        .map((o) => o.text)}`;

      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "mistral",
          prompt: prompt,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const responseData = await response.json();

      if (responseData && "response" in responseData) {
        setExplanation(responseData.response);
      } else {
        console.error("Response does not contain explanation:", responseData);
      }
    } catch (error) {
      console.error("Error fetching explanation:", error);
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
                You've completed all {totalQuestions} questions in this practice
                session.
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => (window.location.href = "/")}
                className="w-full sm:w-auto bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
              >
                🏠 Return to Home
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 ml-0 sm:ml-4"
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
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="relative min-h-40">
        <div className="flex justify-center ">
          <button
            type="button"
            onClick={() => {
              if (currentQuestionIndex < lastIndex + 2) {
                setShowCorrectAnswer(true);
              } else {
                setShowCorrectAnswer(false);
              }
              reset();
              handleNextQuestion(currentQuestionIndex - 1);
            }}
            disabled={!(currentQuestionIndex > 1) || !canGoBack}
            className="group"
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
              if (currentQuestionIndex < lastIndex) {
                setShowCorrectAnswer(true);
              } else {
                setShowCorrectAnswer(false);
              }
              reset();
              handleNextQuestion(currentQuestionIndex + 1);
            }}
            disabled={!(currentQuestionIndex < lastIndex)}
            className="group"
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
        <p className="text-gray-900 dark:text-white md:px-12 pt-10 pb-5 select-none">
          {question}
        </p>
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
            className="fixed top-0 left-0 z-50 w-full h-full flex justify-center items-center bg-black bg-opacity-50"
          >
            <img
              src={link + selectedImage.url}
              alt={selectedImage.alt}
              className="max-w-[90%] max-h-[90%]"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-3 right-5 px-3 py-1 bg-white text-black rounded-md"
            >
              Close
            </button>
          </div>
        )}
      </div>
      <ul className="flex flex-col gap-2 mt-5 mb-16 select-none md:px-12 px-0 h-max min-h-[250px]">
        {options.map((option, index) => (
          <li key={index}>
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
      {explanation && (
        <div className="md:px-12 mb-16">
          <div className="bg-slate-800 border border-slate-600 rounded-lg p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full flex items-center justify-center">
                <SiHelpdesk className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">Explanation</h3>
            </div>
            <div className="text-slate-200 leading-relaxed whitespace-pre-line">
              {explanation}
            </div>
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
        {ollamaAvailable && (
          <Button
            type="button"
            intent="secondary"
            size="medium"
            variant="outlined"
            disabled={isThinking}
            onClick={() => {
              setShowCorrectAnswer(true);
              setIsThinking(true);
              explainCorrectAnswer();
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
            disabled={currentQuestionIndex < lastIndex}
            onClick={() => {
              if (!showCorrectAnswer) {
                setSavedAnswers((prev) => ({
                  ...prev,
                  [currentQuestionIndex]: watchInput,
                }));
              }
              setShowCorrectAnswer(false);
              setExplanation(null);
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
