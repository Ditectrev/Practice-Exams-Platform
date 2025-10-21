import Link, { LinkProps } from "next/link";
import clsx from "clsx";
import { AnchorHTMLAttributes } from "react";
import { useTheme } from "../contexts/ThemeContext";

interface NameLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">,
    LinkProps {
  heading: string;
  paragraph: string;
  wrapperClassNames?: string;
  headingClassNames?: string;
}

const NameLink = ({
  heading,
  paragraph,
  wrapperClassNames,
  headingClassNames,
  ...linkProps
}: NameLinkProps) => {
  const { theme } = useTheme();

  return (
    <Link
      {...linkProps}
      className={clsx(
        "group rounded-xl w-full h-[100px] cursor-pointer transition-all duration-200",
        "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
        "hover:shadow-xl hover:shadow-primary-500/20 hover:scale-105 hover:border-primary-500 dark:hover:shadow-xl dark:hover:shadow-primary-500/20 dark:hover:border-primary-500",
        wrapperClassNames,
      )}
    >
      <div
        className={clsx(
          headingClassNames,
          "flex flex-col justify-center items-center h-full rounded-xl px-7",
        )}
      >
        <h2
          className={clsx(
            "uppercase text-xl font-bold transition-colors duration-200",
            "text-gray-900 dark:text-white",
            "group-hover:text-primary",
          )}
        >
          {heading}
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {paragraph}
        </p>
      </div>
    </Link>
  );
};

export default NameLink;
