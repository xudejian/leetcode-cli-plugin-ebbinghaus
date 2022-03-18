package leetcode;

import java.util.*;

public class TreeNode {
  public int val;
  public TreeNode left;
  public TreeNode right;
  public TreeNode() {}
  public TreeNode(int val) { this.val = val; }
  public TreeNode(int val, TreeNode left, TreeNode right) {
    this.val = val;
    this.left = left;
    this.right = right;
  }

  public static TreeNode fromArray(Integer[] vals) {
    if (vals.length < 1 || vals[0] == null) {
      return null;
    }
    TreeNode head = new TreeNode(vals[0]);
    Queue<TreeNode> q = new LinkedList();
    q.offer(head);
    int i = 1;
    while (q.size() > 0) {
      for (int z = q.size(); z-->0;) {
        TreeNode node = q.poll();
        Integer n = (i < vals.length) ? vals[i++] : null;
        if (n != null) {
          node.left = new TreeNode(n);
          q.offer(node.left);
        }

        n = (i < vals.length) ? vals[i++] : null;
        if (n != null) {
          node.right = new TreeNode(n);
          q.offer(node.right);
        }
      }
    }
    return head;
  }
}
