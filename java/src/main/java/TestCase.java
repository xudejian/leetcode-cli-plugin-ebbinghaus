import java.lang.reflect.Method;
import java.lang.reflect.Type;
import java.util.*;

import leetcode.*;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonSyntaxException;

public class TestCase {
  private Object[] args;
  public final Object expect;
  public final List<String> data;

  public TestCase(List<String> data, Method method) {
    this.data = data;
    Class[] parameters = method.getParameterTypes();
    this.args = new Object[parameters.length];
    if (parameters.length + 1 != data.size()) {
      throw new RuntimeException("test case parameters.length != arguments.length");
    }
    Gson gson = new Gson();
    for (int i=0; i<parameters.length; i++) {
      try {
        if (parameters[i] == ListNode.class) {
          int[] ints = gson.fromJson(data.get(i), int[].class);
          this.args[i] = ListNode.from(ints);
        } else if (parameters[i] == TreeNode.class) {
          Integer[] ints = gson.fromJson(data.get(i), Integer[].class);
          this.args[i] = TreeNode.fromArray(ints);
        } else {
          this.args[i] = gson.fromJson(data.get(i), parameters[i]);
        }
      } catch (JsonSyntaxException ie) {
        System.out.println("type:" +parameters[i].getName());
        System.out.println("data:" +data.get(i));
        throw ie;
      }
    }
    Type _return = method.getGenericReturnType();
    System.out.println("return type:" +_return.getTypeName());
    if (method.getReturnType() == void.class) {
      System.out.println("return void:" +data.get(parameters.length));
      this.expect = null;
    } else if (method.getReturnType() == ListNode.class) {
      int[] ints = gson.fromJson(data.get(parameters.length), int[].class);
      this.expect = ListNode.from(ints);
    } else {
      this.expect = gson.fromJson(data.get(parameters.length), method.getReturnType());
    }
  }

  public Object[] getData() {
    return this.args;
  }

  public List<String> getOrigData() {
    return this.data;
  }

  private Gson getGson() {
    return new GsonBuilder()
      //.registerTypeAdapter(ListNode.class, new ListNodeJsonHelper())
      .create();
  }
}
