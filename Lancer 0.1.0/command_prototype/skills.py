potentials = """
KING
-----
-xxx-
-x-x-
-xxx-
-----

KNT
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

CAL
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

SNP
x-x-x
-----
x---x
-----
x-x-x

BAR
-----
-x-x-
-----
-x-x-
-----

WAR
x---x
-x-x-
-----
-x-x-
x---x
"""

inborn_skills = """
KING
-----
-xxx-
-x-x-
-xxx-
-----

KNT
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
"""

def split_paras(i):
    lines = i.splitlines()
    lines.append("")
    nonempty = []
    for l in lines:
        if l and not l.isspace():
            nonempty.append(l)
        elif len(nonempty) > 0:
            yield nonempty
            nonempty = []

def read_unit(u):
    name = u[0]
    moves = u[1:]
    return (name, read_moves(moves))

def read_units(i):
    unit_map = {}
    units = [read_unit(p) for p in split_paras(i)]
    for u in units:
        name, moves = u
        unit_map[name] = moves
    return unit_map

def read_moves(m):
    s = [[c == 'x' for c in l] for l in m]
    return flip_skillset(zip(*s))

def flip_skillset(s):
    return [list(reversed(c)) for c in s]

op_skillset_union = lambda a, b: a or b
op_skillset_common = lambda a, b: a and b
op_skillset_subtract = lambda a, b:a and not b

def op_skillsets(operator, set1, set2):
    return [
        [operator(set1[i][j], set2[i][j]) for j in range(skillset_size)]
        for i in range(skillset_size)
    ]

##def op_skillset(operator, skillset):
##    return [skillset
##        [operator(set1[i][j], set2[i][j]) for j in range(skillset_size) for i in range(skillset_size)]

def copy_skillset(skillset):
    return op_skillsets(op_skillset_union, skillset, empty_skillset())

def empty_skillset():
    return [[False] * skillset_size for i in range(skillset_size)]

skillset_size = 5
potential_skillset = read_units(potentials)
inborn_skillset = read_units(inborn_skills)
