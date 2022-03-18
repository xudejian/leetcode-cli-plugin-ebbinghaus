import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.lang.reflect.Type;
import java.util.*;

import com.google.common.base.CaseFormat;

public class App {
  public static void main(String[] args) {

    String filename = args[0];
    Problem problem = Problem.fromCode(filename);

    Class solutionClass = null;
    try {
      solutionClass = Class.forName("Solution");
    } catch (ClassNotFoundException cnfe) {
      cnfe.printStackTrace();
    }

    Fixture fixture = null;
    Method[] methods = solutionClass.getDeclaredMethods();
    for (Method m : methods) {
      if (Modifier.isPublic(m.getModifiers()) && m.getName().equals(problem.getFuncName())) {
        fixture = new Fixture(m, problem);
        break;
      }
    }

    List<List<String>> testcases = problem.getTestCases();
    //ArrayList<ArrayList<String>> testcases = fixture.loadTestCasesFromTxt(testFilename);
    fixture.SetTestCases(testcases);

    System.out.println("some thing from solution." + problem.getFuncName());
    try {
      fixture.runTest(solutionClass.newInstance());
    } catch (Exception e) {
      e.printStackTrace();
    }
  }
}
