export const assertNever = (_x: never): never => {
  throw new Error("Unexpected object");
};
