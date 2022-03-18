package leetcode;

public class ListNode {
  public int val;
  public ListNode next;
  public ListNode() {}
  public ListNode(int val) { this.val = val; }
  public ListNode(int val, ListNode next) { this.val = val; this.next = next; }

  public ListNode(int[] vals) {
    ListNode head = null;
    for (int i=vals.length; --i>=0;) {
      head = new ListNode(vals[i], head);
    }
    if (head != null) {
      this.val = head.val;
      this.next = head.next;
    }
  }

  public static ListNode from(int[] vals) {
    ListNode head = null;
    for (int i=vals.length; --i>=0;) {
      head = new ListNode(vals[i], head);
    }
    return head;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    ListNode that = (ListNode) o;
    if (this.val != that.val) {
      return false;
    }
    if (this.next == that.next) {
      return true;
    }
    return this.next != null && this.next.equals(that.next);
  }

  @Override
  public String toString() {
    if (next == null) {
      return " " + val;
    }
    return " " + val + " " + next.toString();
  }
}

