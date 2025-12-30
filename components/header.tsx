import Link from "next/link";

const Header = () => {
  return (
    <p className="mb-6">
      <Link className="text-sm text-primary-600 dark:text-primary-400 font-semibold hover:text-primary-700 dark:hover:text-primary-500 transition-colors duration-200" href={"/"} >← Back to home</Link>
    </p>
  );
};

export default Header;
