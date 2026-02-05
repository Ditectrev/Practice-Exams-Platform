import { Question } from "@practice-tests-exams-platform/components/types";
import { useState } from "react";

export type ResultsData = {
  questions: Question[];
  answers: [] | (string | string[] | null)[];
};

export type ResultsHook = {
  points: number;
  reCount: (data: ResultsData) => void;
};

const useResults = (): ResultsHook => {
  const [points, setPoints] = useState(0);

  const countPoints = (data: ResultsData) => {
    let points = 0;
    for (let i = 0; i < data.questions?.length; i++) {
      if (!data.answers[i] || !data.questions[i]) continue;
      const noOfAnswers = data.questions[i]?.options
        ? data.questions[i]?.options?.filter((el: any) => el.isAnswer === true)
            .length
        : 0;
      if (noOfAnswers > 1) {
        let partialPoints = 0;
        const pointRaise = Math.round((1 / noOfAnswers) * 100) / 100;
        let isOneBad = false;
        let pointRaisedCount = 0;
        if (Array.isArray(data.answers[i])) {
          for (const answer of data.answers[i] ?? []) {
            if (
              data.questions[i]?.options
                ?.filter((el: any) => el.isAnswer === true)
                .some((el: any) => el.text === answer)
            ) {
              partialPoints = partialPoints + pointRaise;
              pointRaisedCount = pointRaisedCount + 1;
            }
            if (
              data.questions[i]?.options
                ?.filter((el: any) => el.isAnswer === false)
                .some((el: any) => el.text === answer)
            ) {
              partialPoints = partialPoints - pointRaise;
              isOneBad = true;
            }
          }
        }
        if (!isOneBad && pointRaisedCount === noOfAnswers) {
          points = Math.round((points + 1) * 100) / 100;
        } else {
          points =
            points +
            (partialPoints > 0 ? Math.round(partialPoints * 100) / 100 : 0);
          points = Math.round(points * 100) / 100;
        }
      } else if (noOfAnswers === 1 && !Array.isArray(data.answers[i])) {
        if (
          data.questions[i]?.options?.filter(
            (el: any) => el.isAnswer === true,
          )[0]?.text === data.answers[i]
        ) {
          points = Math.round((points + 1) * 100) / 100;
        }
      }
    }
    setPoints(points);
  };

  return {
    points: points,
    reCount: countPoints,
  };
};

export default useResults;
