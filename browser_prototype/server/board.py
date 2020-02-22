from const import board_size_x, board_size_y, player_1, player_2
from copy import deepcopy
from entity import Position, Wagon, Archer, Rider, King, Soldier, Barbarian, Unit
import json

board_setting_1st_row = [Archer, Wagon, Archer, Rider, King, Rider, Archer, Wagon, Archer]
board_setting_2nd_row = [Barbarian, Soldier, Barbarian, Soldier, Barbarian, Soldier, Barbarian, Soldier, Barbarian]

class Board:
    def __init__(self, constructor=lambda: None):
        self.board = [[
            constructor()
            for j in range(board_size_y)]
            for i in range(board_size_x)]

    def at(self, position):
        return self.board[position.x][position.y]
    
    def put(self, position, unit):
        self.board[position.x][position.y] = unit

    def remove(self, position):
        unit = self.board[position.x][position.y]
        self.board[position.x][position.y] = None
        return unit

    def move(self, move):
        unit = self.at(move.position_from)
        self.put(move.position_to, unit)
        self.remove(move.position_from)

    def iterate_units(self, func):
        for i in range(board_size_x):
            for j in range(board_size_y):
                u = self.board[i][j]
                if u is not None:
                    func(u, Position(i, j))
    
    def copy(self):
        return deepcopy(self)

    def serialize(self):
        s = []
        for i in range(board_size_x):
            for j in range(board_size_y):
                unit = self.at(Position(i, j))
                if unit:
                    s.append(unit.serialize())
                else:
                    s.append(0)
        return json.dumps(s)

    @classmethod
    def deserialize(cls, payload):
        b = Board()
        s = json.loads(payload)
        for i in range(board_size_x):
            for j in range(board_size_y):
                u = s.pop(0)
                if u != 0:
                    b.put(Position(i, j), Unit.deserialize(u))
        return b

def set_out(board):
    for row, setting, player in [
        (0, board_setting_1st_row, player_2),
        (1, board_setting_2nd_row, player_2),
        (board_size_y - 1, board_setting_1st_row, player_1),
        (board_size_y - 2, board_setting_2nd_row, player_1)
    ]:
        for i in range(board_size_x):
            board.put(Position(i, row), setting[i](player, flip_skillset=player==player_1))

class ArriverMap:
    def __init__(self):
        self.map = { player_1: None, player_2: None }

    def count(self):
        return int(self.map[player_1] is not None) + int(self.map[player_2] is not None)

    def arrived_players(self):
        return [player for player in self.map if self.map[player] is not None]
    
    def get(self, player):
        return self.map[player]

class ReinforcerMap:
    def __init__(self):
        self.map = { player_1: [], player_2: [] }
    
    def get(self, player):
        return self.map[player]

class HeatMap:
    def __init__(self):
        self.map = { player_1: 0, player_2: 0 }

    def get(self, player):
        return self.map[player]        

class BattleOutcome:
    def __init__(self, player_won, arriver_map, reinforcers_map):
        self.arriver_map = arriver_map
        self.reinforcers_map = reinforcers_map
        self.player_won = player_won
    
    def arriver_won(self):
        if self.tied():
            return None
        return self.arriver_map.get(self.player_won)

    def tied(self):
        return self.player_won is None

    def is_skirmish(self):
        return self.arriver_map.count() > 1

class ForceBoard:
    def __init__(self):
        self.reinforce_board = Board(ReinforcerMap)
        self.arrive_board = Board(ArriverMap)

    def heat(self, position, player):
        rmap = self.reinforce_board.at(position)
        amap = self.arrive_board.at(position)
        heat = len(rmap.get(player))
        if amap.get(player) is not None:
            heat += 1
        return heat

    def battle(self, position):
        winner = None
        for player, other in [(player_1, player_2), (player_2, player_1)]:
            if self.heat(position, player) > self.heat(position, other):
                winner = player

        return BattleOutcome(
            winner, 
            self.arrive_board.at(position), 
            self.reinforce_board.at(position))

    def reinforce(self, position, player, unit):
        self.reinforce_board.at(position).get(player).append(unit)

    def reinforcers(self, position, player):
        return self.reinforce_board.at(position).get(player)

    def arrive(self, position, player, unit):
        amap = self.arrive_board.at(position)
        assert(amap.get(player) is None)
        amap.map[player] = unit

    def arriver(self, position, player):
        return self.arrive_board.at(position).get(player)

    def iterate_battles(self, func):
        for i in range(board_size_x):
            for j in range(board_size_y):
                p = Position(i, j)
                if self.arrive_board.at(p).count() > 0:
                    func(p)

class HeatBoard:
    def __init__(self):
        self.board = Board(HeatMap)

    def heat(self, position, player):
        return self.board.at(position).get(player)

    def heatup(self, position, player):
        self.board.at(position).map[player] += 1

    def iterate(self, func):
        for i in range(board_size_x):
            for j in range(board_size_y):
                p = Position(i, j)
                func(self.board.at(p), p)