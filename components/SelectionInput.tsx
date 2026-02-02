"use client";

import React, { forwardRef, InputHTMLAttributes } from "react";
import MarkdownRenderer from "./MarkdownRenderer";

type Props = {
  index?: string;
  type?: "radio" | "checkbox";
  label?: string;
  isAnswer: boolean;
  showCorrectAnswer?: boolean;
  disabled?: boolean;
  checked?: boolean;
} & InputHTMLAttributes<HTMLInputElement>;

const SelectionInput = forwardRef<HTMLInputElement, Props>(
  function SelectionInput(
    {
      index,
      id = `option-${index}`,
      type = "radio",
      label = "Input Label",
      value,
      isAnswer = false,
      showCorrectAnswer,
      disabled = false,
      defaultChecked,
      ...rest
    },
    ref,
  ) {
    return (
      <>
        <input
          ref={ref}
          type={type}
          disabled={disabled}
          value={label}
          id={id}
          className={`peer hidden [&:checked_+_label_svg_path]:block `}
          defaultChecked={defaultChecked}
          {...rest}
        />
        <label
          htmlFor={id}
          className={`m-[1px] flex cursor-pointer items-center rounded-lg border transition-all duration-200 hover:scale-105 p-4 text-xs sm:text-sm font-medium shadow-sm ${
            showCorrectAnswer && isAnswer
              ? defaultChecked
                ? "border-emerald-500 bg-emerald-500/25 hover:border-emerald-400 hover:bg-emerald-600/50"
                : "peer-checked:border-emerald-500 peer-checked:bg-emerald-500/50 border-emerald-500 bg-emerald-500/25 hover:border-emerald-400 hover:bg-emerald-600/50"
              : defaultChecked
              ? "border-gray-400 dark:border-gray-500 bg-gray-100 dark:bg-gray-700 hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-xl hover:shadow-primary-500/20 dark:hover:shadow-xl dark:hover:shadow-primary-500/20"
              : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:shadow-xl hover:shadow-primary-500/20 dark:hover:shadow-xl dark:hover:shadow-primary-500/20 hover:border-primary-500 dark:hover:border-primary-500 peer-checked:border-gray-500 dark:peer-checked:border-gray-500 peer-checked:bg-gray-100 dark:peer-checked:bg-gray-700"
          }`}
        >
          <svg
            className={`border ${
              type === "checkbox" ? "rounded" : "rounded-full"
            } absolute h-5 w-5 p-0.5 ${
              showCorrectAnswer && isAnswer
                ? "text-emerald-500 border-emerald-600"
                : "text-gray-700 dark:text-gray-300 border-gray-400 dark:border-gray-600"
            }`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path
              className={`${defaultChecked ? "block" : "hidden"}`}
              fillRule="evenodd"
              d="M 2 0 a 2 2 0 0 0 -2 2 v 12 a 2 2 0 0 0 2 2 h 12 a 2 2 0 0 0 2 -2 V 2 a 2 2 0 0 0 -2 -2 H 2 z z"
              clipRule="evenodd"
            />
          </svg>

          <span
            className="text-gray-900 dark:text-white pl-7 break-words inline-block w-full"
            suppressHydrationWarning
          >
            <MarkdownRenderer variant="answer">
              {String(label || "")}
            </MarkdownRenderer>
          </span>
        </label>
      </>
    );
  },
);

export default SelectionInput;
