import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime)

export const timeFromNow = (second: number) =>
  (typeof second !== 'number') ? '' : dayjs.unix(second).fromNow();