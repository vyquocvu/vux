export const secondToDateString = (second: number) => {
  if (typeof second === 'number') {
    return new Date(second * 1000).toDateString();
  }
  return '';
}