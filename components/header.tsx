import Link from "next/link";

const Header = () => {
  return (
    <p className="mb-6">
      <Link className="text-sm text-primary-600 font-semibold hover:text-primary-700 transition-colors duration-200" href={"/"} >← Back to home</Link>
    </p>
  );
};

export default Header;
