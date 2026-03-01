using { tictactoe as db } from '../db/datamodel';

service MatchService {
  entity Match as projection on db.Match;

  action aiMove(board: String, player: String, difficulty: Int16) returns Integer;
}