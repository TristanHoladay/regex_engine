import { symbolMap } from "./symbolMap_functions";

export const checkIsRegex = (pattern: String): void => {
  if (!(pattern[0] === "/" && pattern[pattern.length - 1] === "/"))
    throw new Error("Not a regular expression");
};

export const checkForLonelyQuantifier = (char: string): void => {
  if (symbolMap.has(char) && char !== ".")
    throw new Error("Quantifier needs a quanitifiable pattern");
};

export const checkForQuantifiedQuantifiers = (tokens: string): void => {
  //const immuneTokens = new Set([".", "d"]);
  const tokenArray = Array.from(tokens);
  for (let index in tokenArray) {
    const token = tokenArray[index];
    const nextToken = tokenArray[parseInt(index) + 1];

    if (
      symbolMap.has(token) &&
      symbolMap.has(nextToken) &&
      token !== "." &&
      nextToken !== "."
    ) {
      throw new Error(
        `You cannot quantify a quantifier (i.e. ${tokenArray[index]}${nextToken})`
      );
    }
  }
};
