import Link from "next/link";

const Footer = () => {
  return (
    <p>
      <Link href="/about" legacyBehavior>
        <a className="text-xs">[ about ]</a>
      </Link>
      <Link href="/terms" legacyBehavior>
        <a className="text-xs">[ terms ]</a>
      </Link>
    </p>
  );
};

export default Footer;
