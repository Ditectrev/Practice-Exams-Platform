import type { NextPage } from "next";
import ExamLink from "@azure-fundamentals/components/ExamLink";

const Modes: NextPage<{ searchParams: { url: string; name: string } }> = ({
  searchParams,
}) => {
  const { url, name } = searchParams;

  return (
    <div className="mx-auto mb-6 w-full md:w-[90vw] lg:w-[70vw] 2xl:w-[45%] text-center">
      <h2 className="text-gray-900 dark:text-gray-100 text-4xl text-leading font-bold uppercase md:mt-14">
        {name}
      </h2>
      <p className="text-gray-900 dark:text-gray-100 text-lg mt-4 mb-14 px-5 leading-6">
        Test your knowledge under pressure with our timed exam mode or explore
        and master all the questions at your own pace with our practice mode.
      </p>
      <div className="flex max-sm:flex-col max-sm:align-center justify-center gap-10 mx-5 md:mx-16">
        <ExamLink
          href={{
            pathname: "/practice",
            query: { url, name },
          }}
          heading="Practice mode"
          paragraph="Learn and familiarize yourself with the questions and answers without any time constraint."
          subparagraph="You can copy URL to comeback to the same question later."
        />
        <ExamLink
          href={{
            pathname: "/exam",
            query: { url, name },
          }}
          heading="Exam mode"
          paragraph="Put your knowledge to the test by answering a fixed number of randomly selected questions under a time
            limit."
        />
      </div>
    </div>
  );
};

export default Modes;
