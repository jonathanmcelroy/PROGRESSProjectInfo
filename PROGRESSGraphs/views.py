from django.shortcuts import render

def index(request):
    return render(request, 'index.html', {})

def procedureGraph(request):
    return render(request, 'procedureGraph.html', {})
