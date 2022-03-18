import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.FileNotFoundException;
import java.io.IOException;

import com.google.gson.annotations.Expose;
import com.google.gson.annotations.SerializedName;

public class TemplateMeta {
  public String name;
  public TypeMeta[] params;

  @SerializedName("return")
  public TypeMeta returnType;
  public Link output;

  public TemplateMeta(String define) {
    // int smallestRepunitDivByK(int k)
    //System.out.println("define: " + define);
    int start = define.indexOf('(');
    if (start != -1) {
      String func = define.substring(0, start).strip();
      //System.out.println("func: " + func);
      int end = func.lastIndexOf(' ');
      this.name = func.substring(end+1).strip();
      this.returnType = new TypeMeta("return", func.substring(0, end).strip());

      end = define.indexOf(')', start);
      if (end == -1) {
        end = define.length();
      }
      String[] params = define.substring(start+1, end).split(",");
      this.params = new TypeMeta[params.length];
      for (int i=0; i<params.length; i++) {
        //System.out.println("param: " + params[i]);
        String[] kw = params[i].strip().split(" ");
        this.params[i] = new TypeMeta(kw[1], kw[0]);
      }
    }
  }

  public void dump() {
    System.out.println("main func name " + name);
    returnType.dump();
    for (TypeMeta m : params) {
      m.dump();
    }
  }
}
