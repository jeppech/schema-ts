export function email(err = 'expected an email') {
  return (value: string) => {
    if (!value.match(/^((?!\.)[\w\-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$/)) {
      return err;
    }
  };
}
