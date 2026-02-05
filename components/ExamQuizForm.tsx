"use client";

import SelectionInput from "@practice-tests-exams-platform/components/SelectionInput";
import { Button } from "@practice-tests-exams-platform/components/Button";
import { FC } from "react";
import { useForm } from "react-hook-form";
import { Question } from "@practice-tests-exams-platform/components/types";
import LoadingIndicator from "./LoadingIndicator";
import MarkdownRenderer from "./MarkdownRenderer";

type Props = {
  isLoading: boolean;
  questionSet: Question;
  handleNextQuestion: (q: number) => void;
  handleSkipQuestion: (q: number) => void;
  currentQuestionIndex: number;
  totalQuestions: number;
  isQuestionAnswered: (q: number) => boolean;
  setAnswer: (isCorrect: boolean) => void;
};

const ExamQuizForm: FC<Props> = ({
  isLoading,
  questionSet,
  handleNextQuestion,
  handleSkipQuestion,
  currentQuestionIndex,
  totalQuestions,
  setAnswer,
  isQuestionAnswered,
}) => {
  const { register, handleSubmit, reset } = useForm();

  const onSubmit = () => {
    if (currentQuestionIndex > totalQuestions) {
      reset();
      return;
    }
    handleNextQuestion(currentQuestionIndex + 1);
  };

  if (isLoading) return <LoadingIndicator />;

  if (!questionSet) {
    handleNextQuestion(1);
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-red-500 text-lg font-semibold">
          Oops! Something went wrong while loading the questions.
        </p>
        <p className="text-white text-md mt-2">
          Please try refreshing the page or check your internet connection.
        </p>
      </div>
    );
  }

  const { question, options } = questionSet;

  const noOfAnswers = options.filter((el) => el.isAnswer).length;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="relative min-h-40 mt-8">
        <div
          className="text-white px-12 py-6 select-none"
          suppressHydrationWarning
        >
          <MarkdownRenderer variant="question">{question}</MarkdownRenderer>
        </div>
      </div>
      <ul className="flex flex-col gap-2 mt-5 mb-16 select-none md:px-12 px-0 h-max min-h-[250px]">
        {options.map((option, index) => (
          <li key={`q${currentQuestionIndex}-o${index}`}>
            <SelectionInput
              {...register("options." + currentQuestionIndex)}
              index={`answer-${index}`}
              type={noOfAnswers > 1 ? "checkbox" : "radio"}
              label={option.text}
              isAnswer={option.isAnswer}
              onClick={() => setAnswer(option.isAnswer)}
            />
          </li>
        ))}
      </ul>
      <div className="flex justify-center flex-col sm:flex-row gap-4">
        <Button
          type="button"
          intent="primary"
          size="medium"
          onClick={() => {
            reset();
            handleSkipQuestion(currentQuestionIndex);
          }}
        >
          Skip Question
        </Button>
        <Button
          type="button"
          intent="secondary"
          size="medium"
          disabled={!isQuestionAnswered(currentQuestionIndex)}
          onClick={onSubmit}
        >
          Next Question
        </Button>
      </div>
    </form>
  );
};

export default ExamQuizForm;
