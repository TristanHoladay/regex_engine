import { handleLastTokenNotMatched } from "./parser";

const isQuantifiedAnyCharRemaingAfterInputLoop = (tokensAfterQuant: string) => {
  return tokensAfterQuant && !tokensAfterQuant.includes("*");
};

const moveThrewQuantifiedInput = (tokens: string, input: string): boolean => {
  const inputArray = Array.from(input);
  const mapKeys = Array.from(symbolMap.keys());
  let match: boolean;
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
        return tokensAfterQuant[0] === char;
      }
    }
  }

  if (!isQuantifiedAnyCharRemaingAfterInputLoop(tokensAfterQuant)) match = true;

  return match;
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
    return currentToken === currentChar;
  }
};

const quantifyBySpecificNum = (tokens: string, input: string): boolean => {
  const closingBraceIndex = tokens.indexOf("}");
  const numberOf = tokens.substring(2, closingBraceIndex);
  let match: boolean;
  let i: number = 0;

  while (i < parseInt(numberOf)) {
    if (tokens[0] === "d") {
      return !isNaN(Number(input[i]));
    } else {
      match = tokens[0] === input[i];
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
        match = tokens[index] === input[index];
      }

      // match = pickAndRunNextCase(tokens, input, parseInt(index));
      // if (!match) break;
    }
  }

  return match;
};

const matchAnyChar = (tokens: string, input: string): boolean => {
  let match: boolean;
  const inputArray = Array.from(input);

  if (handleLastTokenNotMatched(tokens, input)) {
    return false;
  }

  for (const index in inputArray) {
    if (tokens[index] !== ".") {
      return pickAndRunNextCase(tokens, input, parseInt(index));
    } else {
      match = true;
    }
  }

  return match;
};

const matchDigits = (tokens: string, input: string): boolean => {
  const inputArray = Array.from(input);
  let match: boolean;

  for (const index in inputArray) {
    if (tokens[index] !== "d") {
      return pickAndRunNextCase(tokens, input, parseInt(index));
    } else {
      match = !isNaN(Number(input[index]));
    }
  }

  return match;
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

export const symbolMap = new Map<string, Function>([
  ["*", matchZeroToUnlimited],
  ["+", matchOneToUnlimited],
  ["?", matchZeroOrOne],
  [".", matchAnyChar],
  ["{", quantifyBySpecificNum],
]);

export const escapedSymbolsMap = new Map<string, Function>([
  ["d", matchDigits],
]);
