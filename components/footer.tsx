import Link from "next/link";

const Footer = () => {
  return (
    <footer className="mt-12 pt-8 border-t border-neutral-200">
      <p className="flex gap-4 text-sm text-neutral-600">
        <Link href="/about" className="hover:text-primary-600 transition-colors duration-200 font-medium">About</Link>
        <Link href="/terms" className="hover:text-primary-600 transition-colors duration-200 font-medium">Terms</Link>
      </p>
    </footer>
  );
};

export default Footer;
