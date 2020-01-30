from entity import Board, player_1, player_2, Position, Move
import rule
import random

class Game:
    def __init__(self):
        self.board = Board()
        self.board.set_out()
        self.last_move = {
            player_1: None,
            player_2: None
        }
        self.last_move_type = {
            player_1: None,
            player_2: None
        }
    
    def player_moved(self, player):
        return self.last_move[player] is not None
    
    def get_last_move(self, player):
        return self.last_move[player]
    
    def get_last_move_type(self, player):
        return self.last_move_type[player]
    
    def get_status(self):
        return rule.status(self.board)

    def target_same_position(self):
        if self.player_moved(player_1) and self.player_moved(player_2):
            return self.last_move[player_1].position_to == \
                self.last_move[player_2].position_to
        return False

    def get_random_move(self, player):
        return random.choice(
            rule.all_valid_moves(self.board, player, True))
    
    def make_move(self, move_p1, move_p2):
        self.board, \
        self.last_move_type[player_1], \
        self.last_move_type[player_2] = \
            rule.make_move(self.board, move_p1, move_p2)
        self.last_move[player_1], \
        self.last_move[player_2] = move_p1, move_p2

    def validate_move(self, move, player):
        rule.validate_move(self.board, move, player)