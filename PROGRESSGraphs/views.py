import json

from django.http import HttpResponse
from django.shortcuts import render

from .models import Node, Edge

def index(request):
    return render(request, 'index.html', {})

def fileGraph(request):
    context = {}
    return render(request, 'fileGraph.html', context)

def procedureGraph(request):
    return render(request, 'procedureGraph.html', {})

def jsonGraph(request):
    return HttpResponse(json.dumps({
        'nodes': [{
            'id':     node.name,
            'label':  node.name,
        } for node in Node.objects.all()],
        'edges': [{
            'from': edge.user.name,
            'to':   edge.used.name,
        } for edge in Edge.objects.all()],
    }), content_type="application/json")
