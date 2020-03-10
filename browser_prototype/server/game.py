from entity import Position, Move, PlayerMove, Wagon
from board import Board, set_out
from const import player_1, player_2, board_size_x
import rule
import random
from enum import Enum
from copy import copy
import json

class GameStatus(Enum):
    Ongoing = 0
    Victorious = 1
    Defeated = 2
    Draw = 3

class Game:
    supply_initial = 20
    supply_basic_incremental = 20
    msg_not_enough_supply = "not enough supply"

    def __init__(self, board=None):
        if board is None:
            self.board = Board()
            set_out(self.board)
        else:
            self.board = board
            
        self.last_player_action = {
            player_1: None,
            player_2: None
        }

        self.supply = {
            player_1: Game.supply_initial,
            player_2: Game.supply_initial
        }

        self.round_count = 0
        self.martyr_list = []

    def get_status(self):
        return {
            0: GameStatus.Ongoing,
            1: GameStatus.Victorious,
            2: GameStatus.Defeated,
            3: GameStatus.Draw
        }[rule.status(self.board)]

    def make_move(self, player_move_list):
        for player_move in player_move_list:
            self.validate_player_move(player_move)

        next_board, player_action_map, martyr_list = \
            rule.make_move(self.board, player_move_list)

        next_game = Game(next_board)
        next_game.last_player_action = player_action_map
        next_game.round_count = self.round_count + 1
        next_game.martyr_list = martyr_list

        buff_board = rule.get_buff_board(self.board)

        for player_action in player_action_map.values():
            player = player_action.player
            next_game.supply[player] = self.supply[player] - player_action.get_cost(buff_board)
            next_game.supply[player] += Game.supply_basic_incremental
            next_game.supply[player] += self.wagon_supply(player)
            next_game.supply[player] += self.trophy_supply(player, martyr_list)

        return next_game

    def validate_player_move(self, player_move):
        player_action = rule.validate_player_move(self.board, player_move)
        buff_board = rule.get_buff_board(self.board)
        if player_action.get_cost(buff_board) > self.supply[player_action.player]:
            raise rule.InvalidMoveException(Game.msg_not_enough_supply)
        return player_action

    def replenish(self, amount):
        for player in self.supply:
            self.supply[player] += amount

    def wagon_supply(self, player):
        revenue = 0
        def collect_revenue(u, _):
            nonlocal revenue
            if u.owner == player and type(u) == Wagon:
                revenue += 2 if u.is_perfect() else 1
        self.board.iterate_units(collect_revenue)
        return revenue
    
    def trophy_supply(self, player, martyr_list):
        total = 0
        for martyr in martyr_list:
            if not martyr.has_trophy:
                continue
            unit = martyr.board_unit.unit
            if unit.owner != player:
                total += unit.get_trophy()
        return total

    def count_unit(self, player):
        return rule.count_unit(self.board, player)

    def serialize(self):
        return json.dumps([
            self.round_count, 
            self.supply, 
            self.board.serialize(), 
            [player_action.serialize() for player_action in self.last_player_action.values() if player_action is not None],
            [
                [
                    martyr.board_unit.position.serialize(), 
                    martyr.board_unit.unit.get_trophy() if martyr.has_trophy else 0
                ] for martyr in self.martyr_list
            ]
        ])
    
    @classmethod
    def deserialize(cls, payload):
        g = Game()
        g.round_count, g.supply, p_board = json.loads(payload)
        g.board = Board.deserialize(p_board)
        return g
        