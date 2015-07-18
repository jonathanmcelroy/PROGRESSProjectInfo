from django.db import models

class Node(models.Model):
    TYPE_CHOICES = (
        ("var", "Variable"),
        ("proc", "Procedure"),
        ("func", "Function"),
    )
    name = models.CharField()
    progressType = models.CharField(max_length = 4,
                                    choices = TYPE_CHOICES)
    edges = models.ManyToManyField("self", through="Edge", symmetrical=False, related_name="Uses")

class Edge(models.Model):
    user = models.ForeignKey(Node, related_name="User")
    used = models.ForeignKey(Node, related_name="Used")
