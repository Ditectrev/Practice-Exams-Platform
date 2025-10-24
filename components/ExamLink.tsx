import Link, { LinkProps } from "next/link";
import clsx from "clsx";
import { AnchorHTMLAttributes } from "react";

interface ExamLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">,
    LinkProps {
  heading: string;
  paragraph: string;
  subparagraph?: string;
  wrapperClassNames?: string;
  headingClassNames?: string;
}

const ExamLink = ({
  heading,
  paragraph,
  wrapperClassNames,
  headingClassNames,
  subparagraph = "",
  ...linkProps
}: ExamLinkProps) => {
  return (
    <Link
      {...linkProps}
      className={clsx(
        "group rounded-xl w-full h-[350px] cursor-pointer transition-all duration-200",
        "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
        "hover:shadow-xl hover:shadow-primary-500/20 hover:scale-105 hover:border hover:border-primary-500 dark:hover:shadow-xl dark:hover:shadow-primary-500/20 dark:hover:border dark:hover:border-primary-500",
        "card-hover-effect flex flex-col justify-center items-center px-7",
        wrapperClassNames,
      )}
    >
      <h2
        className={clsx(
          "uppercase text-3xl font-bold transition-colors duration-200 text-center",
          "text-gray-900 dark:text-white",
          "group-hover:text-primary",
          headingClassNames,
        )}
      >
        {heading}
      </h2>
      <p
        className="text-sm text-gray-600 dark:text-gray-400 mt-10 text-center"
        dangerouslySetInnerHTML={{ __html: paragraph }}
      />
      {subparagraph !== "" && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
          {subparagraph}
        </p>
      )}

      {/* Corner arrow */}
      <div className="go-corner">
        <div className="go-arrow">→</div>
      </div>
    </Link>
  );
};

export default ExamLink;
