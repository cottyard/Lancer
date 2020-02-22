potential_skill_matrices = """
KING
-----
--x--
-x-x-
--x--
-----

RDR
-x-x-
x---x
-----
x---x
-x-x-

LAN
-xxx-
x---x
x---x
x---x
-xxx-

KNT
-x-x-
xx-xx
-----
xx-xx
-x-x-

SLD
-----
--x--
-x-x-
--x--
-----

SWD
-----
-xxx-
-x-x-
-xxx-
-----

SPR
--x--
--x--
xx-xx
--x--
--x--

ACH
--x--
-----
x---x
-----
--x--

BAR
-----
-x-x-
-----
-x-x-
-----

WAR
--x--
-x-x-
x---x
-x-x-
--x--

WAG
-----
--x--
-xxx-
--x--
-----
"""

inborn_skill_matrices = """
KING
-----
--x--
-x-x-
--x--
-----

RDR
-x-x-
-----
-----
-----
-----

SLD
-----
--x--
-----
--x--
-----

ACH
--x--
-----
-----
-----
--x--

BAR
-----
-x-x-
-----
-----
-----

WAG
-----
-----
--x--
-----
-----
"""

def split_paras(literal):
    lines = literal.splitlines()
    lines.append("")
    nonempty = []
    for l in lines:
        if l and not l.isspace():
            nonempty.append(l)
        elif len(nonempty) > 0:
            yield nonempty
            nonempty = []

def read_tag_and_skill_list(tag_and_skill_matrix):
    tag = tag_and_skill_matrix[0]
    skill_matrix = tag_and_skill_matrix[1:]
    return (tag, read_skill_list(skill_matrix))

def read_skill_list_map(skill_maps_literal):
    return dict([
        read_tag_and_skill_list(tag_and_skill_matrix) 
        for tag_and_skill_matrix in split_paras(skill_maps_literal)])

def read_skill_list(skill_matrix):
    matrix = [[c == 'x' for c in l] for l in skill_matrix]
    skill_list = []
    for i in range(0, len(matrix)):
        for j in range(0, len(matrix[i])):
            if matrix[i][j]:
                skill_list.append((j, len(matrix[i]) - 1 - i))
    return skill_list

potential_skill_list_map = read_skill_list_map(potential_skill_matrices)
inborn_skill_list_map = read_skill_list_map(inborn_skill_matrices)
