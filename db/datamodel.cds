namespace tictactoe;

entity Match {
  key ID : UUID;
  PlayerXWins : Int16;
  PlayerOWins : Int16;
  Date: DateTime;
  OpponentWasAI : Boolean;
}