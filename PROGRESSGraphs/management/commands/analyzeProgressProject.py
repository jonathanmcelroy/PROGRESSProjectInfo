import os
import re

from django.core.management.base import BaseCommand, CommandError
from PROGRESSGraphs.models import Node, Edge

from .functionalProgramming import *

class Command(BaseCommand):
    help = "Creates a call graph for a project directory"

    def add_arguments(self, parser):
        parser.add_argument('folder', type=str)

    def handle(self, *args, **options):
        Node.objects.all().delete()
        top = options['folder']

        # for each file in the top directory
        L = [Node(name = os.path.normcase(os.path.join(dirpath, filename)),
                  progressType = "proc")
                for (dirpath, dirnames, filenames) in os.walk(top)
                    for filename in filenames
                        if os.path.splitext(filename)[1] in (".w", ".p")]
        Node.objects.bulk_create(L)

        propath = ""
        # get the propath
        with open(os.path.join(top, "Real stec.ini")) as f:
            for line in f:
                if line.startswith("PROPATH="):
                    propath = line[8:].split(",")
                    break;

        for node in Node.objects.all():
            analyzeFile(propath, node)

def analyzeFile(propath, node):
    # get the contents of the file without the comments
    path = node.name
    dirname, filename = os.path.split(path)
    contents = ""
    with open(node.name, errors='replace') as f:
        contents = f.read()
    contents = removeComments(contents)

    # for each external procedure call
    print(node)
    for match in getExternalProcedureReferences(contents):
        procedure = match.group("procedure")
        procedurePath = ""
        for head in propath:
            if not os.path.isabs(head):
                head = os.path.join(dirname, head)
            calledPath = os.path.join(head, procedure)
            if os.path.isfile(calledPath):
                procedurePath = os.path.normcase(calledPath)
                break
        files = Node.objects.filter(name=procedurePath)
        if files:
            edge = Edge(user = node, used = files[0])
            edge.save()

definitionsStartRegex = re.compile("\b&ANALYZE-SUSPEND _UIB-CODE-BLOCK _CUSTOM _DEFINITIONS", re.I)
sectionEndRegex = re.compile("\b&ANALYZE-RESUME", re.I)

procedureStartRegex = re.compile(r"\bprocedure\s+(?P<procedure>[\w#$%&-]+)", re.I)
procedureEndRegex = re.compile(r"\bend\s+procedure", re.I)

# TODO: add types
variableDefinitionRegex = re.compile(r"def(?:ine)?\s+(?:new\s+)?(?:shared\s+)?(?:(?:private|protected|public)\s+)?var(?:iable)?\s+(?P<variable>[\w#$%&-]+)", re.I)
# TODO: take care of "RUN procedure IN handle" case
externalProcedureCallRegex = re.compile(r"run\s+[\"']?(?P<procedure>[\w#$%&-]+\.[wpr])", re.I)
smartObjectCreateRegex = re.compile(r"run\s+constructObject\s*\(\s*input\s+['\"]?(?P<procedure>[\w#$%&-/]+\.w)", re.I)
internalProcedureCallRegex = re.compile(r"run\s+[\"']?(?P<procedure>[\w#$%&-]+)", re.I)

def removeComments(contents):
    def removeComment(startIndex):
        index = startIndex + 2
        while index < len(contents):
            if contents[index:index+2] == "*/":
                return contents[:startIndex] + contents[index+2:]
            elif contents[index:index+2] == "/*":
                removeComment(index)
            index += 1
        # if we get here, there is a comment that goes to the end of the file
        return contents[:startIndex]
    index = 0
    while index < len(contents):
        if contents[index:index+2] == "/*":
            contents = removeComment(index)
        index += 1
    return contents

def getStart(regex, contents):
    return Maybe.boolMaybe(regex.search(contents))

def getEnd(regex, contents, start):
    return Maybe.boolMaybe(regex.search(contents, start.end()))

def getAllInRange(regex, start, end, contents):
    # mresult = regex.finditer <$> Just contents <|> start <|> end
    mresult = Maybe(partial(regex.finditer)).applyAll(Maybe(contents), start, end)
    # case mresult of
    #   Nothing     -> []
    #   Just result -> result
    if mresult.isNothing():
        return List()
    else:
        return List(*mresult.fromMaybe())

def getGlobalVariables(contents):
    # defStartMatch = getStart definitionsStartRegex contents
    defStartMatch = getStart(definitionsStartRegex, contents)
    # defEndMatch = getStart >>= getEnd sectionEndRegex contents
    defEndMatch   = defStart.bind(partial(getEnd, sectionEndRegex, contents))
    # getAllInRange variableDefinitionRegex (.end() <$> defStartMatch) (.start() <$> defEndMatch) contents
    return getAllInRange(variableDefinitionRegex, defStartMatch.fmapMethod("end"), defEndMatch.fmapMethod("start"), contents)

def getProcedureDefinitions(contents):
    return List(*procedureStartRegex.finditer(contents))

def getExternalProcedureCalls(contents):
    return List(*externalProcedureCallRegex.finditer(contents))

def getSmartObjectCreations(contents):
    return List(*smartObjectCreateRegex.finditer(contents))

def getExternalProcedureReferences(contents):
    return getExternalProcedureCalls(contents) + getSmartObjectCreations(contents)

def getProcedureCalls(contents):
    return List(*internalProcedureCallRegex.finditer(contents))

def getProcedureCallsInProcedure(procMatch, contents):
    procEndMatch = getEnd(procedureEndRegex, contents, procMatch)
    return getAllInRange(internalProcedureCallRegex, Maybe(procMatch.end()), procEndMatch.fmapMethod("start"), contents)

def printJSON(names, connections):
    # graph :: Map String (Set String)
    print(json.dumps({"nodes": list(names), "edges": {key: list(value) for key, value in connections.items()}}))

'''
if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        raise Exception("No file given")
    progressFile = sys.argv[1]
    contents = ""
    with open(progressFile) as f:
        contents = f.read()
    contents = removeComments(contents)
    # print(getGlobalVariables(contents))
    # print(getProcedureDefinitions(contents))
    # print(getProcedureCalls(contents))

    graph = {}

    procDefs = getProcedureDefinitions(contents)
    for procDef in procDefs:
        procCalls = getProcedureCallsInProcedure(procDef, contents)
        graph[procDef.group("procedure")] = set(procCalls.fmapMethod("group", "procedure"))

    printJSON(procDefs.fmapMethod("group", "procedure"), graph)
'''
