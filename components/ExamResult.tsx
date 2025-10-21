import { Button } from "@azure-fundamentals/components/Button";

type Props = {
  status: boolean;
  points: number;
  elapsedSeconds: number;
  setRevealExam: (set: boolean) => void;
};

const ExamResult: React.FC<Props> = ({
  status,
  points,
  elapsedSeconds,
  setRevealExam,
}) => {
  return (
    <div className="mt-16 flex flex-col place-items-center gap-8">
      {status ? (
        <h2 className="text-3xl sm:text-4xl font-semibold text-center text-green-500 sm:mt-5">
          EXAM PASSED
        </h2>
      ) : (
        <h2 className="text-3xl sm:text-4xl font-semibold text-center text-red-500 sm:mt-5">
          EXAM FAILED
        </h2>
      )}

      <div className="flex justify-center relative z-[1]">
        <span className="text-gray-400 dark:text-white opacity-20 dark:opacity-10 font-bold text-7xl sm:text-6xl md:text-8xl lg:text-9xl -z-[1] select-none">
          POINTS
        </span>

        <div className="absolute text-gray-900 dark:text-white text-4xl sm:text-6xl font-semibold text-center grid place-items-center top-0 bottom-0">
          <p>
            <span className={status ? "text-green-500" : "text-red-500"}>
              {points}
            </span>
            /100
          </p>
        </div>
      </div>
      <p className="text-gray-900 dark:text-white text-sm sm:text-lg mx-auto sm:w-[490px] text-center mt-5 mb-10 sm:mb-20">
        {status ? (
          <>
            <p>Congratulations!</p>
            <p>
              You completed the exam in {Math.floor(elapsedSeconds / 60)}{" "}
              minutes and {elapsedSeconds % 60} seconds.
            </p>
          </>
        ) : (
          <>
            <p>
              You didn&apos;t pass the exam, you need to score above 75 to pass,
              keep learning and try again.
            </p>
          </>
        )}
      </p>
      <div className="flex justify-center flex-col sm:flex-row gap-4">
        <Button
          type="button"
          intent="secondary"
          size="medium"
          onClick={() => {
            setRevealExam(true);
          }}
        >
          Reveal Exam
        </Button>
        <Button
          type="button"
          intent="primary"
          size="medium"
          onClick={() => {
            window.location.reload();
          }}
        >
          Retake Exam
        </Button>
      </div>
    </div>
  );
};

export default ExamResult;
