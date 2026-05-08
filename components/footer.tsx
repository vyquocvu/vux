import Link from "next/link";

const Footer = () => {
  return (
    <footer className="mt-16 -mx-8 md:-mx-12 px-8 md:px-12 py-12 bg-surface-dark">
      <p className="flex gap-6 font-body text-sm text-on-dark-soft">
        <Link href="/about" className="text-on-dark hover:text-on-dark transition-colors duration-200 font-medium">About</Link>
        <Link href="/terms" className="text-on-dark hover:text-on-dark transition-colors duration-200 font-medium">Terms</Link>
      </p>
    </footer>
  );
};

export default Footer;
