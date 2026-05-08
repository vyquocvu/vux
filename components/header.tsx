import Link from "next/link";

const Header = () => {
  return (
    <p className="mb-6">
      <Link
        className="font-body text-sm font-medium text-muted dark:text-muted-soft hover:text-primary dark:hover:text-primary transition-colors duration-200"
        href={"/"}
      >
        ← Back to home
      </Link>
    </p>
  );
};

export default Header;
