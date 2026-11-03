import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const field =
  'w-full mb-5 px-3.5 py-2.5 rounded-md bg-canvas dark:bg-surface-dark-soft ' +
  'border border-hairline dark:border-surface-dark-elevated ' +
  'font-body text-sm text-ink dark:text-on-dark placeholder:text-muted-soft ' +
  'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ' +
  'transition-shadow duration-200';

const label =
  'block font-body text-[11px] uppercase tracking-widest text-muted dark:text-on-dark-soft font-medium mb-1.5';

const channels = [
  { label: 'Email', value: 'vyquocvu@gmail.com', href: 'mailto:vyquocvu@gmail.com' },
  { label: 'GitHub', value: '@vyquocvu', href: 'https://github.com/vyquocvu' },
  { label: 'LinkedIn', value: 'in/vyquocvu', href: 'https://linkedin.com/in/vyquocvu' },
];

const Contact = () => {
  const [status, setStatus] = useState('');

  const submitForm = (ev: any) => {
    ev.preventDefault();
    const form = ev.target;
    const data = new FormData(form);
    const xhr = new XMLHttpRequest();
    xhr.open(form.method, form.action);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.onreadystatechange = () => {
      if (xhr.readyState !== XMLHttpRequest.DONE) return;
      if (xhr.status === 200) {
        form.reset();
        setStatus('SUCCESS');
      } else {
        setStatus('ERROR');
      }
    };
    xhr.send(data);
  }

  return (
    <div className="mx-auto max-w-3xl lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,16rem)] lg:gap-12">
      <div className="post-page-view">
        <Link href="/" legacyBehavior>
          <span className="mb-6 border border-hairline dark:border-surface-dark-elevated hover:border-primary dark:hover:border-primary rounded-full inline-flex items-center justify-center cursor-pointer w-9 h-9 transition-colors duration-200 bg-canvas dark:bg-surface-dark">
            <Image priority width={36} height={36} src="/icons/left_arrow.svg" alt="left" />
          </span>
        </Link>

        {status === 'SUCCESS' ? (
          <div className="mt-2 rounded-lg border border-hairline dark:border-surface-dark-elevated bg-surface-soft dark:bg-surface-dark-soft p-8">
            <h3 className="font-display text-2xl font-normal text-ink dark:text-on-dark">
              Đã gửi. Cảm ơn bạn!
            </h3>
            <p className="mt-2 font-body text-sm text-muted dark:text-on-dark-soft">
              Tôi sẽ trả lời qua email bạn vừa nhập.
            </p>
          </div>
        ) : (
          <form onSubmit={submitForm} action="https://formspree.io/f/xvovgjzr" method="POST" className="mt-2">
            <h3 className="font-display text-3xl font-normal text-ink dark:text-on-dark mb-6 tracking-tight">
              Để lại lời nhắn
            </h3>
            <label htmlFor="name" className={label}>Tên</label>
            <input type="text" id="name" name="name" required placeholder="Tên của bạn" className={field} />
            <label htmlFor="email" className={label}>Email</label>
            <input type="email" id="email" name="email" required placeholder="you@example.com" className={field} />
            <label htmlFor="message" className={label}>Nội dung</label>
            <textarea id="message" name="message" required placeholder="Viết gì đó…" className={`${field} h-28 resize-y`} />
            {status === 'ERROR' && (
              <p className="font-body text-sm font-medium text-error -mt-2 mb-3">Gửi thất bại, thử lại sau nhé.</p>
            )}
            <button
              type="submit"
              className="px-5 py-2.5 rounded-md bg-primary text-on-primary font-body text-sm font-medium hover:bg-primary-active transition-colors duration-200"
            >
              Gửi
            </button>
          </form>
        )}
      </div>

      <aside className="mt-12 lg:mt-0">
        <p className="font-body text-[11px] uppercase tracking-widest text-muted-soft font-medium mb-4">Hoặc liên hệ trực tiếp</p>
        <ul className="space-y-3">
          {channels.map((c) => (
            <li key={c.label}>
              <a href={c.href} className="block font-body text-sm text-ink dark:text-on-dark hover:text-primary">
                {c.label}
                <span className="block text-muted-soft text-xs">{c.value}</span>
              </a>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
};

export const getStaticProps = async () => ({ props: {}, revalidate: 3600 });
export default Contact;
