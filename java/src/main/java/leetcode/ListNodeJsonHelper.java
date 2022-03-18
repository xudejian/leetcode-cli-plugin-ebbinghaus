package leetcode;

import java.lang.reflect.Type;

import com.google.gson.JsonArray;
import com.google.gson.JsonDeserializationContext;
import com.google.gson.JsonDeserializer;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParseException;
import com.google.gson.JsonSerializer;
import com.google.gson.JsonSerializationContext;

public class ListNodeJsonHelper implements JsonDeserializer<ListNode>,JsonSerializer<ListNode> {
  @Override
  public ListNode deserialize(JsonElement json,
      Type typeOfT, JsonDeserializationContext ctx) throws JsonParseException {
    if (json == null) {
      return null;
    }
    if (json.isJsonArray()) {
      JsonArray items = json.getAsJsonArray();
      ListNode head = null;
      ListNode node = null;
      for (int i = 0; i < items.size(); i++) {
        JsonElement row = items.get(i);
        int val = row.getAsInt();
        ListNode nod = new ListNode(val);
        if (i==0) {
          head = nod;
          node = head;
        } else {
          node.next = nod;
          node = nod;
        }
        return head;
      }
    }
    return new ListNode();
  }

  @Override
  public JsonElement serialize(ListNode src,
      Type typeOfSrc, JsonSerializationContext ctx) {
    if (src == null) {
      return null;
    }
    JsonObject json = new JsonObject();
    json.addProperty("zipcode", 1);
    return json;
  }
}
