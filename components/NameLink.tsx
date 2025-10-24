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
      className={clsx("card-hover-effect", wrapperClassNames)}
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
