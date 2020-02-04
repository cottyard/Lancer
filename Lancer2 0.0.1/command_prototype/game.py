from entity import Board, player_1, player_2, Position, Move, PlayerMove
import rule
import random

class Game:
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
            player_1: 0,
            player_2: 0
        }
    
    def player_moved(self, player):
        return self.last_player_action[player] is not None
    
    def get_last_player_action(self, player):
        return self.last_player_action[player]
 
    def get_status(self):
        return rule.status(self.board)

    def get_random_move(self, player):
        return random.choice(
            rule.all_valid_moves(self.board, player, True))
    
    def make_move(self, player_move_list):
        for player_move in player_move_list:
            self.validate_player_move(player_move)

        self.board, self.last_player_action = \
            rule.make_move(self.board, player_move_list)

        for player_action in self.last_player_action.values():
            self.supply[player_action.player] -= player_action.get_cost()

    def validate_player_move(self, player_move):
        player_action = rule.validate_player_move(self.board, player_move)
        if player_action.get_cost() > self.supply[player_action.player]:
            raise rule.InvalidMoveException("not enough supply")
        return player_action
        
    def replenish(self, amount):
        for player in self.supply:
            self.supply[player] += amount