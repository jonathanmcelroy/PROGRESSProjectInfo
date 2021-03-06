from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^/$', views.index, name='index'),
    url(r'^fileGraph/$', views.fileGraph, name='fileGraph'),
    url(r'^procedureGraph/$', views.procedureGraph, name='procedureGraph'),

    url(r'^jsonGraph/$', views.jsonGraph, name='jsonGraph'),
    url(r'^jsonNodeName/$', views.jsonNodeName, name='jsonNodeName'),
]
