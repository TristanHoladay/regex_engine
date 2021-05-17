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
  if (!input.includes(lastToken) && !symbolMap.has(lastToken)) {
    if (
      escapedSymbolsMap.has(lastToken) &&
      tokens[tokens.length - 2] !== "\\"
    ) {
      result = true;
    } else if (!escapedSymbolsMap.has(lastToken)) {
      result = true;
    }
  }
  return result;
};

const matchNextPair = (token: string, stringChar: string): boolean => {
  return token === stringChar;
};

const moveThrewQuantifiedInput = (tokens: string, input: string): boolean => {
  let result = true;
  const inputArray = Array.from(input);
  const mapKeys = Array.from(symbolMap.keys());
  let tokensAfterFirstQuant: string = tokens.slice(2);

  if (handleLastTokenNotMatched(tokens, input)) {
    return false;
  }

  for (const index in inputArray) {
    const char = inputArray[index];
    if (tokens[0] !== char && tokens[0] !== ".") {
      if (
        symbolMap.has(tokensAfterFirstQuant[0]) ||
        symbolMap.has(tokensAfterFirstQuant[1])
      ) {
        const remainingTokens = tokens.slice(2);
        const i = symbolMap.has(tokensAfterFirstQuant[0]) ? 0 : 1;
        const quantSymbol = mapKeys.find((k) => k === tokensAfterFirstQuant[i]);
        const nextQuantIndex = remainingTokens.indexOf(quantSymbol);

        return symbolMap.get(quantSymbol)(
          remainingTokens.slice(nextQuantIndex - i),
          input.slice(parseInt(index))
        );
      } else if (tokensAfterFirstQuant[0] === "\\") {
        return escapedSymbolsMap.get(tokensAfterFirstQuant[1])(
          tokensAfterFirstQuant.slice(1),
          input.slice(parseInt(index))
        );
      } else {
        if (!matchNextPair(tokensAfterFirstQuant[0], char)) return false;
        tokensAfterFirstQuant = tokensAfterFirstQuant.slice(1);
      }
    }
  }

  return result;
};

const digits = (tokens: string, input: string): boolean => {
  let result: boolean;
  const inputArray = Array.from(input);

  for (const index in inputArray) {
    const nextToken = tokens[parseInt(index) + 1];

    if (tokens[index] === "d") {
      result = !isNaN(Number(input[index]));
    } else if (symbolMap.has(nextToken) && nextToken !== ".") {
      return symbolMap.get(nextToken)(
        tokens.slice(parseInt(index)),
        input.slice(parseInt(index))
      );
    } else if (tokens[index] === "\\") {
      return escapedSymbolsMap.get(nextToken)(
        tokens.slice(parseInt(index) + 1),
        input.slice(parseInt(index))
      );
    } else {
      result = tokens[index] === input[index];
    }
  }

  return result;
};

const anyChar = (tokens: string, input: string): boolean => {
  let result = true;
  const inputArray = Array.from(input);

  if (handleLastTokenNotMatched(tokens, input)) {
    return false;
  }

  for (const index in inputArray) {
    const token = tokens[index];
    const nextToken = tokens[parseInt(index) + 1];

    if (tokens[index] !== ".") {
      if (
        symbolMap.has(token) ||
        (symbolMap.has(nextToken) && nextToken !== ".")
      ) {
        const symbol = symbolMap.has(token) ? token : nextToken;
        const i = symbolMap.has(token) ? 1 : 0;
        return symbolMap.get(symbol)(
          tokens.slice(parseInt(index) - i),
          input.slice(parseInt(index) - i)
        );
      } else if (tokens[index] === "\\") {
        return escapedSymbolsMap.get(nextToken)(
          tokens.slice(parseInt(index) + 1),
          input.slice(parseInt(index))
        );
      } else {
        result = tokens[index] === inputArray[index];
      }
    }
  }

  return result;
};

const oneToUnlimited = (tokens: string, input: string): boolean => {
  if (tokens[0] !== input[0]) {
    return false;
  }
  return moveThrewQuantifiedInput(tokens, input);
};

const zeroToUnlimited = (tokens: string, input: string): boolean => {
  return moveThrewQuantifiedInput(tokens, input);
};

const zeroOrOne = (tokens: string, input: string): boolean => {
  if (tokens[0] === input[1]) return false;
  return moveThrewQuantifiedInput(tokens, input);
};

const quantifiersFirst = (tokens: string, input: string): boolean => {
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

const escapedCharFirst = (tokens: string, input: string): boolean => {
  const firstEscapeIndex = tokens.indexOf("\\");
  const tokensB4Escape =
    firstEscapeIndex !== 0 ? tokens.slice(0, firstEscapeIndex) : [];

  for (let index in Array.from(tokensB4Escape)) {
    if (tokensB4Escape[index] !== input[index]) {
      return false;
    }
  }

  return escapedSymbolsMap.get(tokens[firstEscapeIndex + 1])(
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
  ["*", zeroToUnlimited],
  ["+", oneToUnlimited],
  ["?", zeroOrOne],
  [".", anyChar],
]);

const escapedSymbolsMap = new Map<string, Function>([["d", digits]]);

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
      firstQuantIndex < firstEscapeIndex ? quantifiersFirst : escapedCharFirst;

    if (runMatching(tokens, input, firstFunction)) {
      result.match = true;
      result.string = input;
    }
  }

  return result;
};
