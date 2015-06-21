import fileinput

class Maybe:
    def __init__(self, value):
        self.value = value

    def __str__(self):
        if self.value == None:
            return "Nothing"
        else:
            return "Maybe {}".format(str(self.value))

    def andThen(self, function):
        if self.value is None:
            return Nothing
        return function(self.value)
Nothing = Maybe(None)

# Parser a
class Parser:
    # Parser :: (String -> Maybe (a, String)) -> Parser a
    def __init__(self, function):
        self.parserFunc = function

    # parse :: Parser a -> String -> a
    def parse(self, string):
        return self.parserFunc(string)

    # andThen :: Parser a -> (a -> Parser b) -> Parser b
    def andThen(self, function):
        def newParserFunc(string):
            return self.parse(string).andThen(
                lambda myValueRest: function(myValueRest[0]).parse(myValueRest[1])
            )
        return Parser(newParserFunc)

    # andThenIgnore :: Parser a -> Parser b -> Parser b
    def andThenIgnore(self, parser):
        # parser :: Parser b
        return self.andThen(lambda _: parser)

def orParsers(*parsers):
    @Parser
    def parser(string):
        allParses = filter(lambda parse: x is not Nothing, (eachParser.parse(string) for eachParser in parsers))
        return next(allParses, Nothing)
    return parser

def many(parser):
    @Parser
    def newParser(string):
        resultList = []
        parse = parser(string)
        while parse is not Nothing:
            resultObject, string = parse
            result.append(resultObject)
            parse = parser(string)
        return resultList
    return newParser

@Parser
def skipManyWhitespace(string):
    index = 0
    while(string[index].isspace()):
        index += 1
    return Maybe((None, string[index:]))

@Parser
def parseAnyWord(string):
    index = 0
    while(string[index].isalnum()):
        index += 1
    if index == 0:
        return Nothing
    return Maybe((string[:index], string[index:]))

def parseWord(word):
    @Parser
    def parser(string):
        return parseAnyWord.parse(string).andThen(lambda parseWordString:
            Maybe((word, rest)) if parsedWordString[0] == word else Nothing
        )
    return parser

parseAssignment = parseAnyWord.andThen( lambda value :
    skipManyWhitespace.andThenIgnore(
    parseWord("=").andThenIgnore(
    skipManyWhitespace.andThenIgnore(
    parseExpression.andThen( lambda expression :
    (value, expression)
    )))))
    # do
    #   value <- parseAnyWord
    #   skipManyWhitespace
    #   parseWord("=")
    #   skipManyWhitespace
    #   expression <- parseExpression
    #   return (value, expression)

parseExpression = orParsers(
    parseAnyWord
)

def main():
    string = "".join(fileinput.input())
    print(string)
    print(parseAssignment.parse(string))

if __name__ == "__main__":
    main()
