from entity import Board, player_1, player_2, Position, Move, PlayerMove, Wagon, Skill
import rule
import random
from enum import Enum
from copy import copy

class GameStatus(Enum):
    Ongoing = 0
    Victorious = 1
    Defeated = 2
    Draw = 3

class Game:
    supply_initial = 5
    supply_basic_incremental = 3
    msg_not_enough_supply = "not enough supply"

    def __init__(self, board=None):
        if board is None:
            self.board = Board()
            self.board.set_out()
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

    def player_moved(self, player):
        return self.last_player_action[player] is not None
    
    def get_last_player_action(self, player):
        return self.last_player_action[player]
 
    def get_status(self):
        return {
            0: GameStatus.Ongoing,
            1: GameStatus.Victorious,
            2: GameStatus.Defeated,
            3: GameStatus.Draw
        }[rule.status(self.board)]

    def get_random_player_move(self, player):
        move_list = []
        while random.randint(0, 4) != 0:
            if random.randint(0, 5) == 0:
                recruit_position = Position(random.randint(0, rule.board_size_x - 1), rule.spawn_row[player])
                move = Move(recruit_position, recruit_position)
            else:
                move = random.choice(
                    rule.all_valid_moves(self.board, player, True))
            try:
                self.validate_player_move(PlayerMove(player, move_list + [move]))
                move_list.append(move)
            except rule.InvalidMoveException:
                break

        print(move_list)
        return PlayerMove(player, move_list)
    
    def make_move(self, player_move_list):
        for player_move in player_move_list:
            self.validate_player_move(player_move)

        next_board, last_player_action = rule.make_move(self.board, player_move_list)

        next_game = Game(next_board)
        next_game.last_player_action = last_player_action

        for player_action in last_player_action.values():
            player = player_action.player
            next_game.supply[player] = self.supply[player] - player_action.get_cost()
            next_game.supply[player] += Game.supply_basic_incremental
            next_game.supply[player] += self.bonus_supply(player)

        return next_game

    def validate_player_move(self, player_move):
        player_action = rule.validate_player_move(self.board, player_move)
        if player_action.get_cost() > self.supply[player_action.player]:
            raise rule.InvalidMoveException(Game.msg_not_enough_supply)
        return player_action

    def replenish(self, amount):
        for player in self.supply:
            self.supply[player] += amount

    def bonus_supply(self, player):
        return rule.count_unit(self.board, player, Wagon)

    def incremental_supply(self, player):
        return self.bonus_supply(player) + Game.supply_basic_incremental

    def count_unit(self, player):
        return rule.count_unit(self.board, player)
