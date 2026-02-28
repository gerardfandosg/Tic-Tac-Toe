using { tictactoe as db } from '../db/datamodel';

service MatchService {
  entity Match as projection on db.Match;
}