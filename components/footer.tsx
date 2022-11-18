import Link from "next/link";

const Footer = () => {
  return (
    <footer>
      <p>
        <Link href="/about" className="text-xs">[ about ]</Link>
        <Link href="/terms" className="text-xs">[ terms ]</Link>
      </p>
    </footer>
  );
};

export default Footer;
