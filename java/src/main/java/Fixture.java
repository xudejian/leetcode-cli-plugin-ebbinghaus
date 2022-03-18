import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.lang.reflect.Type;
import java.util.*;

import com.google.gson.Gson;

public class Fixture {
  public final Method method;
  public final Problem problem;
  private List<TestCase> tests = null;

  public Fixture(Method m, Problem problem) {
    this.method = m;
    this.problem = problem;
  }

  public void SetTestCases(List<List<String>> testcases) {
    this.tests = new ArrayList();
    for (List data : testcases) {
      this.tests.add(new TestCase(data, this.method));
    }
  }

  private boolean deepEquals(Object a, Object b) {
    if (problem.IsReturnInAnyOrder()) {
      System.out.println(a.getClass());
      System.out.println(b.getClass());
      List alist = (List) a;
      List blist = (List) b;
      if (alist.size() != blist.size()) {
        return false;
      }

      return alist.stream().allMatch(ele -> blist.stream().anyMatch(e -> Objects.deepEquals(e, ele)));
    }
    return Objects.deepEquals(a, b);
  }

  public void runTest(Object obj) {
    for (TestCase tc : tests) {
      boolean same = false;
      Object got = null;
      long t1 = System.currentTimeMillis();
      try {
        got = method.invoke(obj, tc.getData());
        same = deepEquals(got, tc.expect);
      } catch (Exception e) {
        e.printStackTrace();
      } finally {
        int tuse = (int)(System.currentTimeMillis() - t1);
        if (tuse > 1000) {
          System.out.println("Time Limit Exceeded");
          return;
        }
        if (same) {
          System.out.print(".");
          continue;
        }
        Gson gson = new Gson();
        System.out.println("  Data: " + gson.toJson(tc.getOrigData()));
        System.out.println(" Input: " + gson.toJson(tc.getData()));
        System.out.println("Expect: " + gson.toJson(tc.expect));
        System.out.println("   Got: " + gson.toJson(got));
      }
    }
    System.out.println("\nDone");
  }
}
