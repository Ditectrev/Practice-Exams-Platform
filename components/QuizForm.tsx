import { type FC, useState, useEffect } from "react";
import { useForm, FieldValues } from "react-hook-form";
import { Question } from "./types";
import Image from "next/image";
import SelectionInput from "./SelectionInput";
import { Button } from "./Button";

type Props = {
  isLoading: boolean;
  questionSet: Question;
  handleNextQuestion: (q: number) => void;
  currentQuestionIndex: number;
  totalQuestions: number;
  link: string;
};

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
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [ollamaAvailable, setOllamaAvailable] = useState<boolean>(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [lastIndex, setLastIndex] = useState<number>(1);
  const [canGoBack, setCanGoBack] = useState<boolean>(false);
  const [savedAnswers, setSavedAnswers] = useState<{
    [key: number]: string | string[];
  }>({});
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    alt: string;
  } | null>(null);

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

  const onSubmit = (data: FieldValues) => {
    setSavedAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: data.options[currentQuestionIndex],
    }));
    setShowCorrectAnswer(true);
    setCanGoBack(true);
    reset();
  };

  const isOptionChecked = (optionText: string): boolean | undefined => {
    const savedAnswer = savedAnswers[currentQuestionIndex];
    if (savedAnswer !== null && typeof savedAnswer === "string") {
      return savedAnswer === optionText;
    } else {
      return;
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

  if (isLoading) return <p>Loading...</p>;
  //Error Handling for loading issues
  if (!questionSet) return <p>Loading questions failed</p>;

  const { question, options, images } = questionSet!;
  const watchInput = watch(`options.${currentQuestionIndex}`);

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
              className="w-6 h-6 text-slate-300 group-disabled:text-transparent"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
          </button>
          <div className="flex justify-center relative w-[15%] z-[1]">
            <span className="absolute text-white opacity-10 font-bold text-6xl bottom-0 -z-[1] select-none">
              Q&A
            </span>
            <input
              className="w-[40px] text-white rounded-l-md border outline-0 border-slate-700 bg-slate-900 text-center text-md [-moz-appearance:_textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
              type="number"
              min={0}
              max={totalQuestions}
              value={currentQuestionIndex}
              onChange={(e) => {
                if (Number(e.target.value) < lastIndex + 1) {
                  setShowCorrectAnswer(true);
                } else {
                  setShowCorrectAnswer(false);
                }
                handleNextQuestion(Number(e.target.value));
                reset();
              }}
            />
            <p className="text-white text-md font-semibold text-center w-[40px] rounded-r-md border bg-slate-800 border-slate-700">
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
              className="w-6 h-6 text-slate-300 group-disabled:text-transparent"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </button>
        </div>
        <p className="text-white md:px-12 pt-10 pb-5 select-none">{question}</p>
        {images.length !== 0 && (
          <ul className="flex flex-row justify-center gap-2 mt-5 mb-8 select-none md:px-12 px-0">
            {images.map((image) => (
              <li
                key={image.alt}
                className="w-[40px] h-[40px] rounded-md border border-white overflow-hidden flex flex-row justify-center"
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
        <p className="text-white md:px-12 mb-16 select-none">{explanation}</p>
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
        <Button
          type="button"
          intent="primary"
          size="medium"
          disabled={currentQuestionIndex < lastIndex}
          onClick={() => {
            setShowCorrectAnswer(false);
            setExplanation(null);
            setSavedAnswers((prev) => ({
              ...prev,
              [currentQuestionIndex]: watchInput,
            }));
            if (currentQuestionIndex === totalQuestions) {
              handleNextQuestion(1);
              setLastIndex(1);
            } else {
              handleNextQuestion(currentQuestionIndex + 1);
              setLastIndex(currentQuestionIndex + 1);
            }
            setCanGoBack(false);
            reset();
          }}
        >
          Next Question
        </Button>
      </div>
    </form>
  );
};

export default QuizForm;
