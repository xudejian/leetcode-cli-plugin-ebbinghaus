
public class TypeMeta {
  public String name;
  public String type;

  public TypeMeta(String name, String type) {
    this.name = name;
    this.type = type;
  }

  public void dump() {
    System.out.println("name " + name + " type " + type);
  }
}
