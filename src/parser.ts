import {
  checkIsRegex,
  checkForQuantifiedQuantifiers,
  checkForLonelyQuantifier,
} from "./regex_checks";
import { escapedSymbolsMap, symbolMap } from "./symbolMap_functions";

export const removeRegexSlashes = (pattern: String): string => {
  return pattern.slice(1, pattern.length - 1);
};

const runChecks = (pattern: string): void => {
  checkIsRegex(pattern);
  checkForQuantifiedQuantifiers(removeRegexSlashes(pattern));
  checkForLonelyQuantifier(removeRegexSlashes(pattern));
};

export const handleLastTokenNotMatched = (
  tokens: string,
  input: string
): boolean => {
  let result = false;
  const lastToken = tokens[tokens.length - 1];
  const secondToLastToken = tokens[tokens.length - 2];

  if (!input.includes(lastToken) && !symbolMap.has(lastToken)) {
    if (
      (escapedSymbolsMap.has(lastToken) && secondToLastToken !== "\\") ||
      !escapedSymbolsMap.has(lastToken)
    ) {
      result = true;
    }
  }

  return result;
};

const handleQuantifierFirst = (tokens: string, input: string): boolean => {
  const firstQuantifier = Array.from(tokens).find((t) => symbolMap.has(t));
  const firstQuantIndex = tokens.indexOf(firstQuantifier);
  const tokensB4Quantifier =
    firstQuantIndex !== 0 ? tokens.slice(0, firstQuantIndex - 1) : [];

  for (let index in Array.from(tokensB4Quantifier)) {
    if (tokensB4Quantifier[index] !== input[index]) {
      return false;
    }
  }

  tokens = firstQuantIndex !== 0 ? tokens.slice(firstQuantIndex - 1) : tokens;

  return symbolMap.get(firstQuantifier)(
    tokens,
    input.slice(tokensB4Quantifier.length)
  );
};

const handleEscapedCharFirst = (tokens: string, input: string): boolean => {
  const firstEscapeIndex = tokens.indexOf("\\");
  const firstEscapedToken = tokens[firstEscapeIndex + 1];
  const tokensB4Escape =
    firstEscapeIndex !== 0 ? tokens.slice(0, firstEscapeIndex) : [];

  for (let index in Array.from(tokensB4Escape)) {
    if (tokensB4Escape[index] !== input[index]) {
      return false;
    }
  }

  return escapedSymbolsMap.get(firstEscapedToken)(
    tokens.slice(firstEscapeIndex + 1),
    input.slice(tokensB4Escape.length)
  );
};

const hasSymbols = (tokens: string): boolean => {
  return (
    Array.from(tokens)
      .map((char) => symbolMap.has(char))
      .includes(true) || tokens.includes("\\")
  );
};

const getFirstSymbolIndexes = (tokens: string): [number, number] => {
  const firstQuantifier = Array.from(tokens).find((t) => symbolMap.has(t));
  const firstQuantIndex = firstQuantifier
    ? tokens.indexOf(firstQuantifier)
    : tokens.length;
  const firstEscapeIndex = tokens.includes("\\")
    ? tokens.indexOf("\\")
    : tokens.length;

  return [firstQuantIndex, firstEscapeIndex];
};

const runMatching = (
  tokens: string,
  input: string,
  callBack: (tokens: string, input: string) => boolean
): boolean => {
  return callBack(tokens, input);
};

export const findMatch = (
  regex: string,
  input: string
): { match: boolean; string: string } => {
  runChecks(regex);
  let tokens = removeRegexSlashes(regex);
  const result = {
    match: false,
    string: "",
  };

  if (tokens === input) {
    result.match = true;
    result.string = input;
  } else if (hasSymbols(tokens)) {
    const [firstQuantIndex, firstEscapeIndex] = getFirstSymbolIndexes(tokens);
    const firstFunction =
      firstQuantIndex < firstEscapeIndex
        ? handleQuantifierFirst
        : handleEscapedCharFirst;

    if (runMatching(tokens, input, firstFunction)) {
      result.match = true;
      result.string = input;
    }
  }

  return result;
};
