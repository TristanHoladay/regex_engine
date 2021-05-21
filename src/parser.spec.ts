import {
  checkIsRegex,
  findMatch,
  removeRegexSlashes,
  checkForLonelyQuantifier,
  checkForQuantifiedQuantifiers,
  handleLastTokenNotMatched,
} from "./parser";

describe("parsing patterns", () => {
  it("should check it is a regex", () => {
    expect(() => {
      checkIsRegex("tacos/");
    }).toThrowError("Not a regular expression");

    expect(() => {
      checkIsRegex("/tacos");
    }).toThrowError("Not a regular expression");
  });

  it("should parse a single character", () => {
    expect(removeRegexSlashes("/a/")).toEqual("a");
  });

  it("should throw error if single character is a quanitifier", () => {
    expect(() => {
      checkForLonelyQuantifier("*");
    }).toThrowError("Quantifier needs a quanitifiable pattern");

    expect(() => {
      checkForLonelyQuantifier("+");
    }).toThrowError("Quantifier needs a quanitifiable pattern");

    expect(() => {
      checkForLonelyQuantifier("?");
    }).toThrowError("Quantifier needs a quanitifiable pattern");
  });

  it("should handle a quantified quantifier", () => {
    expect(() => {
      checkForQuantifiedQuantifiers("a**");
    }).toThrowError("You cannot quantify a quantifier (i.e. **)");

    expect(() => {
      checkForQuantifiedQuantifiers("a++");
    }).toThrowError("You cannot quantify a quantifier (i.e. ++)");
  });
});

describe("matching", () => {
  describe("full matches", () => {
    it("should match a single character to a single character", () => {
      expect(findMatch("/a/", "a")).toStrictEqual({ match: true, string: "a" });
    });

    it("should not match a single character to a different single character", () => {
      expect(findMatch("/a/", "b")).toStrictEqual({ match: false, string: "" });
    });

    it("should match a two character pattern w/out quantifiers to two characters", () => {
      expect(findMatch("/aa/", "aa")).toStrictEqual({
        match: true,
        string: "aa",
      });
    });

    it("should match a multi-character pattern to a multi-character string", () => {
      expect(findMatch("/abcdefg/", "abcdefg")).toStrictEqual({
        match: true,
        string: "abcdefg",
      });
    });

    describe("*", () => {
      it("should match a single character pattern with quanitifier to a multi-character string", () => {
        expect(findMatch("/a*/", "aaaa")).toStrictEqual({
          match: true,
          string: "aaaa",
        });
      });

      it("should handle fail case of tokens before quantifier", () => {
        expect(findMatch("/abc*/", "accc")).toStrictEqual({
          match: false,
          string: "",
        });
      });

      it("should match a character followed by quanitifier followed by new character to a multi-character string", () => {
        expect(findMatch("/a*b/", "aaaab")).toStrictEqual({
          match: true,
          string: "aaaab",
        });
      });

      it("should match input after * quanitifier", () => {
        expect(findMatch("/a*bc/", "aaaabc")).toStrictEqual({
          match: true,
          string: "aaaabc",
        });
      });

      it("should handle fail case of tokens after * quantifier", () => {
        expect(findMatch("/ab*ce/", "abbc")).toStrictEqual({
          match: false,
          string: "",
        });
      });

      it("should NOT match input after * quantifier", () => {
        expect(findMatch("/a*bc/", "aaaacc")).toStrictEqual({
          match: false,
          string: "",
        });
      });

      it("should match input after * quantifier even if initial token isn't found in input", () => {
        expect(findMatch("/a*bc/", "bc")).toStrictEqual({
          match: true,
          string: "bc",
        });
      });

      it("should match input with * quantifier not after 1st token", () => {
        expect(findMatch("/da*bc/", "daaaaabc")).toStrictEqual({
          match: true,
          string: "daaaaabc",
        });
      });

      it("should match input with multiple tokens before the * quantifier ", () => {
        expect(findMatch("/defa*bc/", "defaaaaabc")).toStrictEqual({
          match: true,
          string: "defaaaaabc",
        });
      });

      it("should match input with multiple tokens, inlcuding same token that later gets quantified, before the * quantifier", () => {
        expect(findMatch("/daefa*bc/", "daefaaaaabc")).toStrictEqual({
          match: true,
          string: "daefaaaaabc",
        });
      });

      it("should match input with multiple quantifiers", () => {
        expect(findMatch("/dae*fa*bc/", "daeeefaaaaabc")).toStrictEqual({
          match: true,
          string: "daeeefaaaaabc",
        });
      });

      it("should match input with more than 2 quantifiers", () => {
        expect(findMatch("/dae*fa*b*c/", "daeeefaaaaabc")).toStrictEqual({
          match: true,
          string: "daeeefaaaaabc",
        });
      });

      it("should match input with more than 2 * quantifiers", () => {
        expect(findMatch("/e*a*b*/", "eeeaaaaab")).toStrictEqual({
          match: true,
          string: "eeeaaaaab",
        });
      });

      it("should handle the 0 case of 0 to unlimited", () => {
        expect(findMatch("/e*a*b*/", "eeeb")).toStrictEqual({
          match: true,
          string: "eeeb",
        });
      });
    });

    describe("+", () => {
      it("should match input with + quanitifier", () => {
        expect(findMatch("/a+/", "aaaaa")).toStrictEqual({
          match: true,
          string: "aaaaa",
        });
      });

      it("should NOT match input with + quanitifier at beginning of pattern", () => {
        expect(findMatch("/+a/", "aaaaa")).toStrictEqual({
          match: false,
          string: "",
        });
      });

      it("should match input with token before + quanitifier", () => {
        expect(findMatch("/ba+/", "ba")).toStrictEqual({
          match: true,
          string: "ba",
        });
      });

      it("should NOT match input missing char that matches token quantified by +", () => {
        expect(findMatch("/ba+/", "b")).toStrictEqual({
          match: false,
          string: "",
        });
      });

      it("should NOT match input with different token after + quanitifier", () => {
        expect(findMatch("/ab+c/", "abd")).toStrictEqual({
          match: false,
          string: "",
        });
      });

      it("should match input with tokens after + quanitifier", () => {
        expect(findMatch("/ab+cd/", "abcd")).toStrictEqual({
          match: true,
          string: "abcd",
        });
      });

      it("should match input with repeated chars machting quantified token", () => {
        expect(findMatch("/ab+cd/", "abbbbcd")).toStrictEqual({
          match: true,
          string: "abbbbcd",
        });
      });

      it("should match input with multiple + quantifiers", () => {
        expect(findMatch("/ab+cd+e/", "abbbbcde")).toStrictEqual({
          match: true,
          string: "abbbbcde",
        });
      });

      it("should match input with multiple + quantifiers and repeated string char in input", () => {
        expect(findMatch("/ab+dcd+e/", "abbbbdcde")).toStrictEqual({
          match: true,
          string: "abbbbdcde",
        });
      });

      it("should match input with different quantifiers -- +, *", () => {
        expect(findMatch("/ab+cd*e/", "abbbbcde")).toStrictEqual({
          match: true,
          string: "abbbbcde",
        });
      });

      it("should match input with more different quantifiers -- +, *", () => {
        expect(findMatch("/ab+cd*e*b+/", "abbbbcdeb")).toStrictEqual({
          match: true,
          string: "abbbbcdeb",
        });
      });
    });

    describe("?", () => {
      it("should match 0 to 1 times using ? quantifier", () => {
        expect(findMatch("/ab*c?d/", "abbcd")).toStrictEqual({
          match: true,
          string: "abbcd",
        });
      });

      it("should handle fail case of tokens after ? quantifier", () => {
        expect(findMatch("/ab*c?d/", "abbc")).toStrictEqual({
          match: false,
          string: "",
        });
      });

      it("should handle fail case of 2 matches ? quantified token", () => {
        expect(findMatch("/ab*c?d/", "abbccd")).toStrictEqual({
          match: false,
          string: "",
        });
      });

      it("should handle match case of tokens after ? quantifier", () => {
        expect(findMatch("/ab*c?d/", "abbcd")).toStrictEqual({
          match: true,
          string: "abbcd",
        });
      });

      it("should handle another fail case of tokens after ? quantifier", () => {
        expect(findMatch("/ab*c?d/", "abbced")).toStrictEqual({
          match: false,
          string: "",
        });
      });

      it("should handle another success case of tokens after ? quantifier", () => {
        expect(findMatch("/ab*c?d/", "abbd")).toStrictEqual({
          match: true,
          string: "abbd",
        });
      });

      it("should handle another success case of tokens after ? quantifier", () => {
        expect(findMatch("/ab*c?de/", "abbde")).toStrictEqual({
          match: true,
          string: "abbde",
        });
      });

      it("should handle multiple ? quantifiers", () => {
        expect(findMatch("/ab*c?de?f/", "abbdef")).toStrictEqual({
          match: true,
          string: "abbdef",
        });
      });

      it("should handle multiple ? quantifiers with repeated character from earlier in string", () => {
        expect(findMatch("/ab*c?ede?f/", "abbcedef")).toStrictEqual({
          match: true,
          string: "abbcedef",
        });
      });

      it("should handle multiple quantifiers", () => {
        expect(findMatch("/ab*c?ede*f/", "abbcedeeef")).toStrictEqual({
          match: true,
          string: "abbcedeeef",
        });
      });
    });

    describe(".", () => {
      it("should match . to any character", () => {
        expect(findMatch("/./", "a")).toStrictEqual({
          match: true,
          string: "a",
        });
      });

      it("should match . to any character case -- ..", () => {
        expect(findMatch("/../", "aa")).toStrictEqual({
          match: true,
          string: "aa",
        });
      });

      it("should match . to any character with proceeding tokens", () => {
        expect(findMatch("/..bc/", "aabc")).toStrictEqual({
          match: true,
          string: "aabc",
        });
      });

      it("should match staggered . tokens", () => {
        expect(findMatch("/..b./", "aabc")).toStrictEqual({
          match: true,
          string: "aabc",
        });
      });

      it("should fail when token after . not matched", () => {
        expect(findMatch("/..c/", "aa")).toStrictEqual({
          match: false,
          string: "",
        });
      });

      it("should fail when tokens beside . don't match", () => {
        expect(findMatch("/..ccbe/", "aabe")).toStrictEqual({
          match: false,
          string: "",
        });
      });

      it("should match with . and other quantifier -- .*", () => {
        expect(findMatch("/..bc*/", "aabcccc")).toStrictEqual({
          match: true,
          string: "aabcccc",
        });
      });

      it("should match with . and other quantifier -- .+", () => {
        expect(findMatch("/..bc+/", "aabc")).toStrictEqual({
          match: true,
          string: "aabc",
        });
      });

      it("should match with all current symbols / quantifiers - . * + ?", () => {
        expect(findMatch("/..bc+d*e?/", "aabcddde")).toStrictEqual({
          match: true,
          string: "aabcddde",
        });
      });

      it("matches char - . - char - +", () => {
        expect(findMatch("/a.c+/", "abcc")).toStrictEqual({
          match: true,
          string: "abcc",
        });
      });

      it("matches char - * - . - .", () => {
        expect(findMatch("/a*.b/", "aabb")).toStrictEqual({
          match: true,
          string: "aabb",
        });
      });

      it("matches char - * - . - .", () => {
        expect(findMatch("/a*../", "aabc")).toStrictEqual({
          match: true,
          string: "aabc",
        });
      });

      it("matches char - * - . - *", () => {
        expect(findMatch("/a*.*/", "aabbb")).toStrictEqual({
          match: true,
          string: "aabbb",
        });
      });

      it("matches char - * - . - +", () => {
        expect(findMatch("/a*.+/", "aa")).toStrictEqual({
          match: false,
          string: "",
        });
      });

      // it("does not matches char - * - . - * - char", () => {
      //   expect(findMatch("/a*.*ce/", "aabbbde")).toStrictEqual({
      //     match: false,
      //     string: "",
      //   });
      // });
    });

    describe("digits", () => {
      it("should match a single number", () => {
        expect(findMatch("/\\d/", "1")).toStrictEqual({
          match: true,
          string: "1",
        });
      });

      it("should match a different single number", () => {
        expect(findMatch("/\\d/", "3")).toStrictEqual({
          match: true,
          string: "3",
        });
      });

      it("should fail to match a single number", () => {
        expect(findMatch("/\\d/", "a")).toStrictEqual({
          match: false,
          string: "",
        });
      });

      it("should fail to match multiple digits", () => {
        expect(findMatch("/\\d\\d/", "1a")).toStrictEqual({
          match: false,
          string: "",
        });
      });

      it("should match digits and string char", () => {
        expect(findMatch("/\\da/", "1a")).toStrictEqual({
          match: true,
          string: "1a",
        });
      });

      it("should match multiple digits", () => {
        expect(findMatch("/\\d\\d/", "12")).toStrictEqual({
          match: true,
          string: "12",
        });
      });

      it("should match multiple digits and string char", () => {
        expect(findMatch("/\\d\\da/", "12a")).toStrictEqual({
          match: true,
          string: "12a",
        });
      });

      it("should match string char - multiple digits - string char", () => {
        expect(findMatch("/a\\d\\db/", "a12b")).toStrictEqual({
          match: true,
          string: "a12b",
        });
      });

      it("should NOT match string char - multiple digits - string char", () => {
        expect(findMatch("/a\\d\\db/", "c12b")).toStrictEqual({
          match: false,
          string: "",
        });
      });

      it("should match - string char - digit - string char - digit", () => {
        expect(findMatch("/a\\db\\d/", "a1b2")).toStrictEqual({
          match: true,
          string: "a1b2",
        });
      });

      it("should match string char - digits - string char - *", () => {
        expect(findMatch("/a\\db*c*/", "a1b")).toStrictEqual({
          match: true,
          string: "a1b",
        });
      });

      it("should match string char - + - digits - string char - *", () => {
        expect(findMatch("/a+\\db*c*/", "a1b")).toStrictEqual({
          match: true,
          string: "a1b",
        });
      });

      it("should match multi string char - + - digit - string char - *s - string char -digit", () => {
        expect(findMatch("/ab+\\dc*d*e.\\d/", "ab1cef2")).toStrictEqual({
          match: true,
          string: "ab1cef2",
        });
      });

      describe("{n}", () => {
        it("matches \\d 2 times based on following {2} group", () => {
          expect(findMatch("/\\d{2}/", "12")).toStrictEqual({
            match: true,
            string: "12",
          });
        });

        it("matches 'a' 2 times based on following {2} group", () => {
          expect(findMatch("/a{2}/", "aa")).toStrictEqual({
            match: true,
            string: "aa",
          });
        });

        it("does NOT match a{2} - b - * - c", () => {
          expect(findMatch("/a{2}b*c/", "aabb")).toStrictEqual({
            match: false,
            string: "",
          });
        });

        it("matches a{2} - . - c - d", () => {
          expect(findMatch("/a{2}.cd/", "aabcd")).toStrictEqual({
            match: true,
            string: "aabcd",
          });
        });

        it("does NOT match a{2} - \\d - . - c - d", () => {
          expect(findMatch("/a{2}\\d.cd/", "aabcd")).toStrictEqual({
            match: false,
            string: "",
          });
        });

        it("matches a{2} - b - . - d", () => {
          expect(findMatch("/a{2}b.d/", "aabcd")).toStrictEqual({
            match: true,
            string: "aabcd",
          });
        });

        it("matches a{2} - \\d - . - c - d", () => {
          expect(findMatch("/a{2}\\d.cd/", "aa1bcd")).toStrictEqual({
            match: true,
            string: "aa1bcd",
          });
        });

        it("does NOT match a{2} - b - c - d", () => {
          expect(findMatch("/a{2}bcd/", "aabd")).toStrictEqual({
            match: false,
            string: "",
          });
        });
      });
    });
  });
});

describe("handleLastTokenNotMatched", () => {
  it("returns true if token not matched", () => {
    expect(handleLastTokenNotMatched("abc", "ab")).toBeTruthy();
  });

  it("returns false if token is matched", () => {
    expect(handleLastTokenNotMatched("abc", "abc")).toBeFalsy();
  });

  it("returns false if last token quantifier", () => {
    expect(handleLastTokenNotMatched("abc*", "abc")).toBeFalsy();
  });

  it("returns true if token is d and not \\ before it and no match", () => {
    expect(handleLastTokenNotMatched("abcd", "abc")).toBeTruthy();
  });

  it("returns false if token is d and there is \\ before it", () => {
    expect(handleLastTokenNotMatched("abc\\d", "abc")).toBeFalsy();
  });

  it("returns false if token is .", () => {
    expect(handleLastTokenNotMatched("a.", "ab")).toBeFalsy();
  });

  it("return false if 2nd to last token is .", () => {
    expect(handleLastTokenNotMatched("a.+", "ab")).toBeFalsy();
  });
});
