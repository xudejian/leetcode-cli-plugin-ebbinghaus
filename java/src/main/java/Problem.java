import java.io.FileReader;
import java.io.StringReader;
import java.io.BufferedReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.ArrayList;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonSyntaxException;

public class Problem {
  public int id;
  public int fid;
  public String name;
  public String slug;
  public String link;
  public String desc;
  public TemplateMeta templateMeta;

  private boolean returnInAnyOrder;

  public static Problem fromCode(String codeFilename) {
    // @lc app=leetcode id=1015 lang=java
    // [1015] Smallest Integer Divisible by K
    // https://leetcode.com/problems/smallest-integer-divisible-by-k/description/
    Problem problem = new Problem();
    try(BufferedReader br = new BufferedReader(new FileReader(codeFilename))) {
      boolean hasMagic = false;
      boolean descEnd = false;
      boolean afterSolution = false;
      boolean waitDefineEnd = false;
      String defineLine = "";
      String magic = "@lc app=leetcode id=";
      String input = null;
      String namePrefix = null;
      String urlPrefix = "https://leetcode.com/problems/";
      StringBuilder desc = new StringBuilder();
      for (String line = br.readLine(); line != null; line = br.readLine()) {
        int i = 0;
        for (; i<line.length(); i++) {
          char c = line.charAt(i);
          if (c == ' ') {
          } else if (c == '/') {
          } else if (c == '*') {
          } else if (c == '#') {
          } else {
            break;
          }
        }
        line = line.substring(i);
        if (!hasMagic) {
          if (line.startsWith(magic)) {
            hasMagic = true;
            int fid = 0;
            for (i=magic.length(); i<line.length(); i++) {
              int n = line.charAt(i) - '0';
              if (n >= 0 && n<= 9) {
                fid = fid * 10 + n;
              } else {
                break;
              }
            }
            problem.fid = fid;
            namePrefix = "["+fid+"] ";
          }
          continue;
        }

        if (namePrefix != null && line.startsWith(namePrefix)) {
          problem.name = line.substring(namePrefix.length());
          namePrefix = null;
          continue;
        }

        if (urlPrefix != null && line.startsWith(urlPrefix)) {
          problem.link = line;
          problem.slug = line.split("/")[4];
          urlPrefix = null;
          continue;
        }


        if (line.startsWith("@lc code=start")) {
          descEnd = true;
          problem.desc = desc.toString();
        }
        if (!descEnd) {
          if (line.length() == 0) {
            desc.append('\n');
          } else {
            if (line.charAt(0) >= 'A' && line.charAt(0) <= 'Z') {
              desc.append('\n');
            } else {
              desc.append(' ');
            }
            desc.append(line);
          }
        }

        if (afterSolution) {
          if (line.startsWith("public")) {
            waitDefineEnd = true;
            line = line.substring(6);
          }
        } else if (descEnd && (line.startsWith("class Solution") || line.startsWith("public class Solution"))) {
          afterSolution = true;
          defineLine = "";
          waitDefineEnd = false;
          continue;
        }

        if (waitDefineEnd) {
            int end = line.indexOf("{");
            if (end == -1) {
              defineLine += line;
            } else {
              problem.templateMeta = new TemplateMeta(line.substring(0, end));
              break;
            }
        }
      }
    } catch(Exception e) {
      e.printStackTrace();
      return null;
    }
    problem.init();
    problem.dump();
    return problem;
  }

  public List<List<String>> getTestCases() {
    TypeMeta[] params = templateMeta.params;
    // Input: l1 = [9,9,9,9,9,9,9], l2 = [9,9,9,9]
    // Output: [8,9,9,9,0,0,0,1]
    List<List<String>> testcases = new ArrayList();
    try(BufferedReader br = new BufferedReader(new StringReader(desc))) {
      boolean waitInput = true;
      boolean waitOutput = false;
      String input = null;
      for (String line = br.readLine(); line != null; line = br.readLine()) {
        if (waitInput && line.startsWith("Input:")) {
          waitInput = false;
          waitOutput = true;
          input = line.substring(7);
        } else if (waitOutput && line.startsWith("Output:")) {
          waitInput = true;
          waitOutput = false;
          String output = line.substring(8).strip();

          List<String> testcase = new ArrayList();
          // Input: root = [1,2,3,4,5,6,7], k = 1
          int fromIndex = 0;
          for (int i=0; i<params.length; i++) {
            String key = params[i].name + " =";
            int end = input.length();
            int start = input.indexOf(key, fromIndex);
            if (start == -1) {
              throw new RuntimeException("parse [" + key + "] fail, please check it: ["+input+"]");
            } else {
              start += key.length();
              while (start < end && input.charAt(start) == ' ') {
                start++;
              }
            }
            fromIndex = start + 1;
            if (i+1 < params.length) {
              String endKey = ", " + params[i+1].name + " =";
              end = input.indexOf(endKey, fromIndex);
            }
            if (end == -1) {
              end = input.length();
            }
            String data = input.substring(start, end);
            testcase.add(data);
          }
          testcase.add(output);
          testcases.add(testcase);
        } else if (waitOutput) {
          input += line;
        }
      }
    } catch(Exception e) {
      e.printStackTrace();
    }
    return testcases;
  }

  public boolean IsReturnInAnyOrder() {
    return returnInAnyOrder;
  }

  public String getFuncName() {
    return templateMeta.name;
  }

  private void init() {
    initAnyOrder();
  }

  private void initAnyOrder() {
    String[] anyOrders = new String[]{
      "Return the solution in <strong>any order</strong>.",
      "Return the solution in any order.",
        "return the answer in <strong>any order</strong>.",
        "return the answer in any order."};
    returnInAnyOrder = false;
    for (String s : anyOrders) {
      if (desc.indexOf(s) > -1) {
        returnInAnyOrder = true;
        return;
      }
    }
  }

  public void dump() {
    System.out.println("id " + id);
    System.out.println("fid " + fid);
    System.out.println("name " + name);
    System.out.println("slug " + slug);
    System.out.println("link " + link);
    System.out.println("desc " + desc);
    templateMeta.dump();
  }
}
