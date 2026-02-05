import useDebounce from "@practice-tests-exams-platform/hooks/useDebounce";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";

interface Props {
  totalQuestions: number;
  currentQuestionIndex: number;
  handleNextQuestion: (index: number) => void;
}

const NumberInputComponent: React.FC<Props> = ({
  totalQuestions,
  currentQuestionIndex,
  handleNextQuestion,
}) => {
  const [inputValue, setInputValue] = useState(currentQuestionIndex);
  const debouncedInputValue = useDebounce(inputValue, 1000);
  const { reset } = useForm();

  // Sync inputValue with currentQuestionIndex when it changes externally
  useEffect(() => {
    setInputValue(currentQuestionIndex);
  }, [currentQuestionIndex]);

  useEffect(() => {
    if (debouncedInputValue !== currentQuestionIndex) {
      handleNextQuestion(debouncedInputValue);
    }
  }, [debouncedInputValue, currentQuestionIndex, handleNextQuestion]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(Number(e.target.value));
    reset();
  };

  return (
    <input
      className="w-[40px] text-gray-900 dark:text-white rounded-l-md border outline-0 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-center text-md [-moz-appearance:_textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
      type="number"
      min={0}
      max={totalQuestions}
      value={inputValue}
      onChange={handleChange}
    />
  );
};

export default NumberInputComponent;
