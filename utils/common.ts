import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export const timeFromNow = (second: number): string =>
  (typeof second !== 'number') ? '' : dayjs.unix(second).fromNow();

export const friendlyStr = (str: string): string => {
  const formatted = str.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/(\s+)/g, '-')
      .replace(/[đĐ]/g, m => m === 'đ' ? 'd' : 'D')
      .replace(/[^a-zA-Z-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLocaleLowerCase();
  return formatted;
}

export const get = <T = any>(obj: any, path: string, defaultValue?: T): T | undefined => {
  const travel = (regexp: RegExp) =>
    String.prototype.split
      .call(path, regexp)
      .filter(Boolean)
      .reduce((res, key) => (res !== null && res !== undefined ? res[key] : res), obj);
  const result = travel(/[,[\]]+?/) || travel(/[,[\].]+?/);
  return result === undefined || result === obj ? defaultValue : result;
};

export const highlight = (): void => {
  document.querySelectorAll('pre').forEach((el: HTMLPreElement) => {
    (window as any).hljs.highlightElement(el);
  });
};