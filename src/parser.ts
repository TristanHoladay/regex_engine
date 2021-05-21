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

export const removeRegexSlashes = (pattern: String): string => {
  return pattern.slice(1, pattern.length - 1);
};

const runChecks = (pattern: string): void => {
  checkIsRegex(pattern);
  checkForQuantifiedQuantifiers(removeRegexSlashes(pattern));
  checkForLonelyQuantifier(removeRegexSlashes(pattern));
};

// could be missing a fail case //
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

const isQuantifiedAnyCharRemaingAfterInputLoop = (tokensAfterQuant: string) => {
  return tokensAfterQuant && !tokensAfterQuant.includes("*");
};

const moveThrewQuantifiedInput = (tokens: string, input: string): boolean => {
  let result = true;
  const inputArray = Array.from(input);
  const mapKeys = Array.from(symbolMap.keys());
  let tokensAfterQuant = tokens.slice(2);

  if (handleLastTokenNotMatched(tokens, input)) {
    return false;
  }

  for (const index in inputArray) {
    const char = inputArray[index];

    if (tokens[0] !== char && tokens[0] !== ".") {
      if (
        symbolMap.has(tokensAfterQuant[0]) ||
        symbolMap.has(tokensAfterQuant[1])
      ) {
        const remainingTokens = tokens.slice(2);
        const i = symbolMap.has(tokensAfterQuant[0]) ? 0 : 1;
        const quantSymbol = mapKeys.find((k) => k === tokensAfterQuant[i]);
        const nextQuantIndex = remainingTokens.indexOf(quantSymbol as string);

        return symbolMap.get(quantSymbol)(
          remainingTokens.slice(nextQuantIndex - i),
          input.slice(parseInt(index))
        );
      } else if (tokensAfterQuant[0] === "\\") {
        return escapedSymbolsMap.get(tokensAfterQuant[1])(
          tokensAfterQuant.slice(1),
          input.slice(parseInt(index))
        );
      } else {
        if (tokensAfterQuant[0] !== char) return false;
        tokensAfterQuant = tokensAfterQuant.slice(1);
      }
    }
  }

  if (isQuantifiedAnyCharRemaingAfterInputLoop(tokensAfterQuant)) return false;

  return result;
};

const currentOrNextIsSymbol = (
  currentToken: string,
  nextToken: string
): boolean => {
  return (
    symbolMap.has(currentToken) ||
    (symbolMap.has(nextToken) && nextToken !== ".")
  );
};

const pickAndRunNextCase = (
  tokens: string,
  input: string,
  index: number
): boolean => {
  let defaultRes = true;
  const currentToken = tokens[index];
  const nextToken = tokens[index + 1];
  const currentChar = Array.from(input)[index];

  if (currentOrNextIsSymbol(currentToken, nextToken)) {
    const symbol = symbolMap.has(currentToken) ? currentToken : nextToken;
    const i = symbolMap.has(currentToken) && currentToken !== "." ? 1 : 0;

    return symbolMap.get(symbol)(
      tokens.slice(index - i),
      input.slice(index - i)
    );
  } else if (currentToken === "\\") {
    return escapedSymbolsMap.get(nextToken)(
      tokens.slice(index + 1),
      input.slice(index)
    );
  } else {
    if (currentToken !== currentChar) defaultRes = false;
  }

  return defaultRes;
};

const matchAnyChar = (tokens: string, input: string): boolean => {
  let result = true;
  const inputArray = Array.from(input);

  if (handleLastTokenNotMatched(tokens, input)) {
    return false;
  }

  for (const index in inputArray) {
    if (tokens[index] !== ".") {
      return pickAndRunNextCase(tokens, input, parseInt(index));
    }
  }
  return result;
};

const matchDigits = (tokens: string, input: string): boolean => {
  let result: boolean;
  const inputArray = Array.from(input);

  for (const index in inputArray) {
    if (tokens[index] !== "d") {
      return pickAndRunNextCase(tokens, input, parseInt(index));
    } else {
      result = !isNaN(Number(input[index]));
    }
  }

  return result;
};

const quantifyPrevToken = (tokens: string, input: string) => {
  const closingBraceIndex = tokens.indexOf("}");
  const numberOf = tokens.substring(2, closingBraceIndex);
  let result: boolean;
  let i: number = 0;

  while (i < parseInt(numberOf)) {
    if (tokens[0] === "d") {
      result = !isNaN(Number(input[i]));
    } else {
      result = tokens[0] === input[i];
    }

    i++;
  }

  if (tokens.slice(closingBraceIndex + 1).length !== 0) {
    tokens = tokens.slice(closingBraceIndex + 1);
    input = input.slice(parseInt(numberOf));
    const inputArray = Array.from(input);

    for (const index in inputArray) {
      if (symbolMap.has(tokens[0]) || symbolMap.has(tokens[1])) {
        const symbol = symbolMap.has(tokens[0]) ? tokens[0] : tokens[1];
        return symbolMap.get(symbol)(tokens, input);
      } else if (tokens[0] === "\\") {
        return escapedSymbolsMap.get(tokens[1])(tokens.slice(1), input);
      } else {
        result = tokens[index] === input[index];
      }
      // try to implement pickAndRunNextCase(tokens, input, parseInt(index));
    }
  }

  return result;
};

const matchOneToUnlimited = (tokens: string, input: string): boolean => {
  if (tokens[0] !== input[0]) {
    return false;
  }
  return moveThrewQuantifiedInput(tokens, input);
};

const matchZeroToUnlimited = (tokens: string, input: string): boolean => {
  return moveThrewQuantifiedInput(tokens, input);
};

const matchZeroOrOne = (tokens: string, input: string): boolean => {
  if (tokens[0] === input[1]) return false;
  return moveThrewQuantifiedInput(tokens, input);
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

const symbolMap = new Map<string, Function>([
  ["*", matchZeroToUnlimited],
  ["+", matchOneToUnlimited],
  ["?", matchZeroOrOne],
  [".", matchAnyChar],
  ["{", quantifyPrevToken],
]);

const escapedSymbolsMap = new Map<string, Function>([["d", matchDigits]]);

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
