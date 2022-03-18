package leetcode;

public class GuessGame {
  private int pick;

  public GuessGame(int pick) {
    this.pick = pick;
  }

  public int guess(int n) {
    if (n < pick) {
      return 1;
    } else if (n > pick) {
      return -1;
    }
    return 0;
  }
}
