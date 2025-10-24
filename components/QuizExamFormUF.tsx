import { useEffect, useState, type FC } from "react";
import Image from "next/image";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { Button } from "./Button";
import useResults from "@azure-fundamentals/hooks/useResults";
import { Question, Option } from "@azure-fundamentals/components/types";
import LoadingIndicator from "./LoadingIndicator";

type Props = {
  isLoading: boolean;
  handleNextQuestion: (q: number) => void;
  handleSkipQuestion: (q: number) => void;
  handleCountAnswered: () => void;
  currentQuestionIndex: number;
  totalQuestions: number;
  question: string;
  questions: Question[];
  options: Option[];
  stopTimer: () => void;
  getResultPoints: (data: number) => void;
  revealExam?: boolean;
  hideExam?: () => void;
  remainingTime?: string;
  link: string;
  images?: { url: string; alt: string }[];
};

const QuizExamForm: FC<Props> = ({
  isLoading,
  handleNextQuestion,
  handleSkipQuestion,
  handleCountAnswered,
  currentQuestionIndex,
  totalQuestions,
  question,
  options,
  stopTimer,
  getResultPoints,
  questions,
  revealExam,
  hideExam,
  remainingTime,
  link,
  images,
}) => {
  const [showCorrectAnswer, setShowCorrectAnswer] = useState<boolean>(false);
  const [savedAnswers, setSavedAnswers] = useState<any>([]);
  const { points, reCount } = useResults();
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    alt: string;
  } | null>(null);
  const noOfAnswers = options
    ? options?.filter((el: any) => el.isAnswer === true).length
    : 0;

  const { control, handleSubmit, setValue, watch, register } = useForm({
    defaultValues: {
      options: [{ checked: false, text: "Option 1", isAnswer: false }],
    },
  });

  const { fields, replace } = useFieldArray({
    control,
    name: "options",
  });

  const onSubmit = () => {
    reCount({ questions: questions, answers: savedAnswers });
    stopTimer();
  };

  useEffect(() => {
    getResultPoints(points);
  }, [points]);

  useEffect(() => {
    if (revealExam) {
      setShowCorrectAnswer(true);
    }
  }, [revealExam]);

  useEffect(() => {
    if (remainingTime === "00:00") {
      handleSubmit(onSubmit)();
    }
  }, [remainingTime]);

  useEffect(() => {
    if (savedAnswers.length > 0) {
      let done = true;
      for (let x = 0; x < savedAnswers.length; x++) {
        if (savedAnswers[x] === null) {
          done = false;
          break;
        }
      }
      if (done === true) {
        handleSubmit(onSubmit)();
      }
    }
  }, [savedAnswers]);

  const nextQuestion = (skip: boolean) => {
    saveAnswers(skip);

    let nextIndex = currentQuestionIndex + 1;

    while (savedAnswers[nextIndex] !== null && nextIndex < totalQuestions) {
      nextIndex++;
    }

    if (nextIndex >= totalQuestions) {
      nextIndex = 0;
      while (savedAnswers[nextIndex] !== null && nextIndex < totalQuestions) {
        nextIndex++;
      }
    }

    const areAllQuestionsAnswered = nextIndex >= totalQuestions;

    if (skip) {
      handleSkipQuestion(nextIndex);
    } else if (areAllQuestionsAnswered) {
      handleSubmit(onSubmit)();
    } else {
      handleCountAnswered();
      handleNextQuestion(nextIndex);
    }
  };

  const isQuestionAnswered = () => {
    const options = watch("options");
    return options.some((option) => option.checked);
  };

  const isOptionChecked = (optionText: string): boolean => {
    const savedAnswer = savedAnswers[currentQuestionIndex];
    return typeof savedAnswer === "string" || !savedAnswer
      ? savedAnswer === optionText
      : savedAnswer.includes(optionText);
  };

  useEffect(() => {
    const savedAnswersInit = Array(totalQuestions).fill(null);
    setSavedAnswers(savedAnswersInit);
  }, [totalQuestions]);

  useEffect(() => {
    const opt = options?.map((option) => ({
      checked: isOptionChecked(option.text),
      text: option.text,
      isAnswer: option.isAnswer,
    }));
    replace(opt || []);
  }, [options]);

  const saveAnswers = async (skip = false) => {
    const saved = [...savedAnswers];
    if (skip) {
      saved[currentQuestionIndex] = null;
    } else {
      const options = watch("options");
      const selectedArr = options
        .filter((opt) => opt.checked)
        .map((opt) => opt.text);
      saved[currentQuestionIndex] =
        noOfAnswers > 1 ? selectedArr : selectedArr[0] || null;
    }
    setSavedAnswers(saved);
  };

  if (isLoading) return <LoadingIndicator />;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="relative min-h-40">
        <div className="relative min-h-40 mt-8">
          <p className="text-gray-900 dark:text-white px-12 py-6 select-none">
            {currentQuestionIndex + 1}. {question}
          </p>
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
          <div className="fixed top-0 left-0 z-50 w-full h-full flex justify-center items-center bg-black bg-opacity-50">
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
              className="absolute top-3 right-5 px-3 py-1 bg-white text-black rounded-md"
            >
              Close
            </button>
          </div>
        )}
      </div>
      <ul className="flex flex-col gap-2 mt-5 mb-16 select-none md:px-12 px-0 h-max min-h-[250px]">
        {fields.map((option, index) => (
          <li key={option.id}>
            <Controller
              name={`options.${index}.checked`}
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type={noOfAnswers > 1 ? "checkbox" : "radio"}
                  id={`options.${currentQuestionIndex}.${index}`}
                  className={`peer hidden [&:checked_+_label_svg_path]:block `}
                  disabled={showCorrectAnswer}
                  checked={field.value}
                  value={field.name}
                  onChange={(e) => {
                    if (noOfAnswers === 1) {
                      fields.forEach((_, idx) => {
                        if (idx !== index) {
                          setValue(`options.${idx}.checked`, false);
                        }
                      });
                      setValue(`options.${index}.checked`, e.target.checked);
                    } else {
                      setValue(`options.${index}.checked`, e.target.checked);
                    }
                  }}
                />
              )}
            />
            <label
              htmlFor={`options.${currentQuestionIndex}.${index}`}
              className={`m-[1px] flex cursor-pointer items-center rounded-lg border transition-all duration-200 hover:scale-105 p-4 text-xs sm:text-sm font-medium shadow-sm ${
                showCorrectAnswer && option.isAnswer
                  ? option.checked
                    ? "border-emerald-500 bg-emerald-500/25 hover:border-emerald-400 hover:bg-emerald-600/50"
                    : `border-emerald-500 bg-emerald-500/25 hover:border-emerald-400 hover:bg-emerald-600/50 ${
                        option.checked
                          ? "border-emerald-500 bg-emerald-500/50"
                          : ""
                      }`
                  : option.checked
                  ? "border-gray-400 dark:border-gray-500 bg-gray-100 dark:bg-gray-700 hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-xl hover:shadow-primary-500/20 dark:hover:shadow-xl dark:hover:shadow-primary-500/20"
                  : `border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:shadow-xl hover:shadow-primary-500/20 dark:hover:shadow-xl dark:hover:shadow-primary-500/20 hover:border-primary-500 dark:hover:border-primary-500 ${
                      option.checked
                        ? "border-gray-400 dark:border-gray-500 hover:border-primary-500 bg-gray-100 dark:bg-gray-700"
                        : ""
                    }`
              }`}
            >
              <svg
                className={`border ${
                  noOfAnswers > 1 ? "rounded" : "rounded-full"
                } absolute h-5 w-5 p-0.5 ${
                  showCorrectAnswer && option.isAnswer
                    ? "text-emerald-500 border-emerald-600"
                    : "text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600"
                }`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path
                  className={`${option.checked ? "block" : "hidden"}`}
                  fillRule="evenodd"
                  d="M 2 0 a 2 2 0 0 0 -2 2 v 12 a 2 2 0 0 0 2 2 h 12 a 2 2 0 0 0 2 -2 V 2 a 2 2 0 0 0 -2 -2 H 2 z z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-gray-900 dark:text-white pl-7 break-words inline-block w-full">
                {option?.text}
              </span>
            </label>
          </li>
        ))}
      </ul>
      {!revealExam ? (
        <div className="flex justify-center flex-col sm:flex-row gap-4">
          <Button
            type="button"
            intent="secondary"
            size="medium"
            onClick={async () => {
              nextQuestion(true);
            }}
          >
            <span>Skip Question</span>
          </Button>
          <Button
            type="button"
            intent="primary"
            size="medium"
            disabled={!isQuestionAnswered()}
            onClick={async () => {
              nextQuestion(false);
            }}
          >
            <span className={`${!isQuestionAnswered() ? "opacity-50" : ""}`}>
              Next Question
            </span>
          </Button>
        </div>
      ) : (
        <div className="flex justify-center flex-col sm:flex-row gap-4">
          <Button
            type="button"
            intent="secondary"
            size="medium"
            disabled={currentQuestionIndex === 0}
            onClick={async () => {
              handleNextQuestion(currentQuestionIndex - 1);
            }}
          >
            <span
              className={`${currentQuestionIndex === 0 ? "opacity-50" : ""}`}
            >
              Previous Question
            </span>
          </Button>
          <Button
            type="button"
            intent="secondary"
            size="medium"
            disabled={currentQuestionIndex === totalQuestions - 1}
            onClick={async () => {
              handleNextQuestion(currentQuestionIndex + 1);
            }}
          >
            <span
              className={`${
                currentQuestionIndex === totalQuestions - 1 ? "opacity-50" : ""
              }`}
            >
              Next Question
            </span>
          </Button>
          <Button
            type="button"
            intent="primary"
            size="medium"
            onClick={() => {
              if (hideExam) {
                hideExam();
              }
            }}
          >
            <span>Back to Summary</span>
          </Button>
        </div>
      )}
    </form>
  );
};

export default QuizExamForm;
