import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime)

export const timeFromNow = (second: number) =>
  (typeof second !== 'number') ? '' : dayjs.unix(second).fromNow();

export const friendlyStr = (str: string) => {
  const formatted = str.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s/g, "-")
      .replace(/[^a-zA-Z-]/g, "")
      .toLocaleLowerCase();
  return formatted;
}
