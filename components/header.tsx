import Link from "next/link";

const Header = () => {
  return (
    <p>
      <Link className="text-xs" href={"/"} >[ home ]</Link>
    </p>
  );
};

export default Header;
