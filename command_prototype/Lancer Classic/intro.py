intro = """
1. SETTINGS

1.1 SKILLS AND POTENTIALS

Each unit has a 5*5 matrix that shows its skills and potentials. Skills represent the unit's current moves. Potentials represent the unit's future moves.

Imagine the unit at the center square of its matrix. Squares marked with "o" are squares it can move to (skills). Squares marked with "x" are squares it can learn to move to (potentials).

Skills can be endowed (2.1) by the player, or absorbed (2.2) from other units.

1.2 BASIC TROOPS AND THEIR MATRICES

KNIGHT(KNT)
-x-x-
x---x
-----
x---x
-x-x-

SOLDIER(SLD)
-----
--x--
-x-x-
--x--
-----

ARCHER(ACH)
--x--
-----
x---x
-----
--x--

BARBARIAN(BAR)
-----
-x-x-
-----
-x-x-
-----

1.3 ADVANCED TROOPS AND THEIR MATRICES

LANCER(LAN)
-xxx-
x---x
x---x
x---x
-xxx-

CALVARY(CAL)
-x-x-
xx-xx
-----
xx-xx
-x-x-

SWORDSMAN(SWD)
-----
-xxx-
-x-x-
-xxx-
-----

SPEARMAN(SPR)
--x--
--x--
xx-xx
--x--
--x--

SNIPER(SNP)
x-x-x
-----
x---x
-----
x-x-x

WARRIOR(WAR)
x---x
-x-x-
-----
-x-x-
x---x

2. RULES

2.1 MOVE AND ENDOW

The two players take turns to input 4 digits per turn as coordinates of 2 squares (square 1 and square 2).

Square 1 should be occupied by one unit of that player's own troop.

If that unit has the skill to move to square 2, it will move to square 2 and take whatever enemy units on that square.
If that unit doesn't have the skill to move to square 2, but has the potential to, it will be endowed with that skill.

Other inputs are invalid.

2.2 ABSORB
When a unit takes an enemy unit, it will absorb all skills of the taken unit as long as it has the potential for those skills.

2.3 PROMOTION
Units that have all their potential endowed will be marked by a *. When basic troops are marked, they will gain potentials of 2 of the advanced troops.
Promotion will happen under either of the following situations:
1. When marked basic troops are endowed a skill that belongs to the potentials of one of the 2 advanced troops.
2. When marked basic troops take an enemy unit and that enemy unit has skills that belong to the potentials of one of the 2 advanced troops.

Upon promotion, the promoted unit will turn into one of the advanced troops, and will immediately lose all potentials from the other advanced troop.

Basic troops and the corresponding advanced troops that they can get promoted to:

Knight: Lancer, Calvary
Soldier: Swordsman, Spearman
Archer: Sniper, Spearman
Barbarian: Warrior, Swordsman

2.4 WINNER
First player to take the enemy King wins.
"""
