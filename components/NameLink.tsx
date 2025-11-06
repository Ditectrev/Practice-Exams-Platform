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
        "group rounded-xl w-full h-[350px] cursor-pointer transition-all duration-200",
        "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
        "hover:shadow-xl hover:shadow-primary-500/20 hover:scale-105 hover:border hover:border-primary-500 dark:hover:shadow-xl dark:hover:shadow-primary-500/20 dark:hover:border dark:hover:border-primary-500",
        "card-hover-effect flex flex-col justify-center items-center px-7",
        wrapperClassNames,
      )}
    >
      <h3
        className={clsx(
          "text-gray-900 dark:text-white text-lg font-bold mb-2",
          headingClassNames,
        )}
      >
        {heading}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{paragraph}</p>

      {/* Corner arrow */}
      <div className="go-corner">
        <div className="go-arrow">→</div>
      </div>
    </Link>
  );
};

export default NameLink;
