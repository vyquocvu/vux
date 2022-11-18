import Link from "next/link";

const Header = () => {
  return (
    <>
      <p>
        <Link href={"/"} legacyBehavior>
          <a className="text-xs">[ home ]</a>
        </Link>
      </p>
    </>
  );
};

export default Header;
