from game import Game
from entity import Soldier, Rider, Lancer, Knight, Warrior, Swordsman, Barbarian, \
    Spearman, King, Position, PlayerMove, Move, Skill, SkillSet, PositionDelta
from const import player_1, player_2
from board import Board
import rule

player_color = {
    player_1: "LIGHTMAGENTA_EX",
    player_2: "YELLOW"
}

player_name = {
    player_1: 'xyt',
    player_2: 'zc'
}

def assert_input():
    b = Board()
    b.put(Position(4, 3), Soldier(player_1))
    b.put(Position(4, 2), Soldier(player_1))
    b.put(Position(4, 4), Soldier(player_2))
    b.put(Position(4, 5), Soldier(player_2))
    g = Game(b)
    g.replenish(100)

    player_action = g.validate_player_move(PlayerMove.from_literal(player_2, "4443 4546"))
    assert(str(player_action) == '55->54(ATK),56->57(MOV)')
    player_action = g.validate_player_move(PlayerMove.from_literal(player_1, "4342 4252"))
    assert(str(player_action) == '54->53(DEF),53->63(UPG)')
    
def assert_invalid_input():
    b = Board()

    b.put(Position(4, 3), Soldier(player_1))
    b.put(Position(4, 4), Soldier(player_2))

    g = Game(b)
    g.replenish(100)

    try:
        g.validate_player_move(PlayerMove.from_literal(player_2, "4443 4454"))
    except rule.InvalidMoveException:
        pass
    else:
        assert(None)

def assert_clash():
    b = Board()
    p1p = Position(4, 3)
    p1p2 = Position(5, 6)
    p2p = Position(4, 4)
    s = Spearman(player_1, SkillSet())
    s.endow(Skill(PositionDelta(0, 1)))
    b.put(p1p, s)
    r = Rider(player_1)
    r.endow(Skill(PositionDelta(-1, -2)))
    b.put(p1p2, r)
    b.put(p2p, Soldier(player_2))
    g = Game(b)
    g.replenish(100)

    g = g.make_move([
        PlayerMove.from_literal(player_2, "4443"),
        PlayerMove.from_literal(player_1, "5644 4344")])

    assert(type(g.martyr_list[0].board_unit.unit) == Soldier)
    assert(type(g.board.at(p1p)) == Spearman)
    assert(type(g.board.at(p2p)) == Rider)

def assert_move_conflict():
    b = Board()
    p1p1 = Position(4, 2)
    p2p1 = Position(4, 4)

    p1p2 = Position(5, 2)
    p1p3 = Position(6, 1)
    p2p2 = Position(5, 4)

    b.put(p1p1, Soldier(player_1))
    b.put(p2p1, Soldier(player_2))
    b.put(p1p2, Soldier(player_1))
    b.put(p1p3, make_perfect(Rider(player_1)))
    b.put(p2p2, Soldier(player_2))
    g = Game(b)
    g.replenish(100)

    g = g.make_move([
        PlayerMove.from_literal(player_2, "4443 5453"),
        PlayerMove.from_literal(player_1, "4243 5253 6153")])
    
    assert(g.board.at(p1p1) is None)
    assert(g.board.at(p2p1) is None)
    assert(g.board.at(p1p2) is None)
    assert(g.board.at(p1p3) is not None)
    assert(g.board.at(p2p2) is None)
    assert(g.board.at(Position(5, 3)).owner == player_1)

def assert_attack_defend():
    b = Board()
    p2u1 = Position.from_literal('55')
    p2u2 = Position.from_literal('66')
    p2u3 = Position.from_literal('61')

    p1u1 = Position.from_literal('54')
    p1u2 = Position.from_literal('53')
    p1u3 = Position.from_literal('62')
    p1u4 = Position.from_literal('67')
    p1u5 = Position.from_literal('56')

    b.put(p2u1, Soldier(player_2))
    b.put(p2u2, make_perfect(Rider(player_2)))
    b.put(p2u3, Soldier(player_2))

    b.put(p1u1, make_perfect(Rider(player_1)))
    b.put(p1u2, Soldier(player_1))
    b.put(p1u3, make_perfect(Rider(player_1)))
    b.put(p1u4, Soldier(player_1))
    b.put(p1u5, Soldier(player_1))

    g = Game(b)
    g.replenish(100)

    g = g.make_move([
        PlayerMove.from_literal(player_2, "4443 5543 5051"),
        PlayerMove.from_literal(player_1, "4243 5143 5655 4544 4335")])

    assert(g.board.at(p2u1).owner == player_1)
    assert(g.board.at(p2u2).owner == player_1)
    assert(g.board.at(p2u3) is None)

    assert(g.board.at(p1u1) is None)
    assert(g.board.at(p1u2).owner == player_1)
    assert(g.board.at(p1u3).owner == player_2)
    assert(g.board.at(p1u4) is None)
    assert(g.board.at(p1u5) is None)

    assert(g.board.at(Position.from_literal('46')).owner == player_1)

def make_perfect(unit):
    for s in unit.perfect_skillset.list_skills():
        unit.endow(s)
    return unit

def assert_buffs():
    b = Board()

    b.put(Position.from_literal('55'), make_perfect(Lancer(player_1, SkillSet())))
    b.put(Position.from_literal('66'), make_perfect(Knight(player_1, SkillSet())))
    b.put(Position.from_literal('46'), make_perfect(Knight(player_1, SkillSet())))
    b.put(Position.from_literal('68'), make_perfect(Warrior(player_2, SkillSet())))
    b.put(Position.from_literal('78'), make_perfect(Spearman(player_1, SkillSet())))
    b.put(Position.from_literal('88'), make_perfect(Spearman(player_1, SkillSet())))
    b.put(Position.from_literal('53'), make_perfect(Soldier(player_1)))
    b.put(Position.from_literal('52'), make_perfect(Soldier(player_2)))
    b.put(Position.from_literal('59'), Swordsman(player_1, SkillSet()))

    g = Game(b)
    g = g.make_move([
        PlayerMove.from_literal(player_1, "4241 4442 5563 4857 6757 7757"),
        PlayerMove.from_literal(player_2, "")])

    assert(g.supply[player_1] == 29) # 40 - 16 + 5

def assert_recall():
    b = Board()

    b.put(Position.from_literal('55'), King(player_1))
    b.put(Position.from_literal('57'), make_perfect(Soldier(player_2, SkillSet())))

    b.put(Position.from_literal('88'), make_perfect(Soldier(player_2, SkillSet())))
    b.put(Position.from_literal('89'), make_perfect(Lancer(player_1, SkillSet())))

    b.put(Position.from_literal('11'), make_perfect(Lancer(player_1, SkillSet())))
    
    g = Game(b)
    try:
        g = g.make_move([
            PlayerMove.from_literal(player_1, "5478"),
            PlayerMove.from_literal(player_2, "")])
    except:
        pass
    else:
        raise Exception()

    try:
        g = g.make_move([
            PlayerMove.from_literal(player_1, "4500"),
            PlayerMove.from_literal(player_2, "")])
    except:
        pass
    else:
        raise Exception()

    g = g.make_move([
        PlayerMove.from_literal(player_1, "5400"),
        PlayerMove.from_literal(player_2, "")])
    
    assert(g.board.at(Position.from_literal('11')) is None)
    assert(g.board.at(Position.from_literal('65')).owner == player_1)

assert_input()
assert_invalid_input()
assert_clash()
assert_move_conflict()
assert_attack_defend()
assert_buffs()
assert_recall()