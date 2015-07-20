from django.db import models

class Node(models.Model):
    TYPE_CHOICES = (
        ("var", "Variable"),
        ("proc", "Procedure"),
        ("func", "Function"),
    )
    name = models.CharField(max_length = 200)
    progressType = models.CharField(max_length = 4,
                                    choices = TYPE_CHOICES)
    edges = models.ManyToManyField("self", through="Edge", symmetrical=False, related_name="Uses")

    def __str__(self):
        return self.name

class Edge(models.Model):
    '''
    TYPE_CHOICES = (
        ("call", "Call"),
        ("sobj", "Smart Object Creation")
    )
    '''

    user = models.ForeignKey(Node, related_name="User")
    used = models.ForeignKey(Node, related_name="Used")

    '''
    edgeType = models.CharField(max_length = 4,
                                choices = TYPE_CHOICES)
    '''

    def __str__(self):
        return "({} -> {})".format(str(self.user), str(self.used))
