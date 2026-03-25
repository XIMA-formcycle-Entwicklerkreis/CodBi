// src/js/Configurations/Financial.ts
function loadConfig() {
  window.codbi.loadConfig({
    targets: ".CodBi_Currency",
    FUNC: "HTML.Input.Cleave",
    config: `^${JSON.stringify({
      numeral: true,
      numeralThousandsGroupStyle: "thousand",
      numeralDecimalMark: ",",
      delimiter: "",
    })
      .replace("{", "<")
      .replace("}", ">")}`,
  });
}
loadConfig();
export { loadConfig };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjL2pzL0NvbmZpZ3VyYXRpb25zL0ZpbmFuY2lhbC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLyoqXG4gKiBSZWdpc3RlcnMgc3RhbmRhcmQgY29uZmlndXJhdGlvbnMgc3BlY2lmaWMgdG8gZmluYW5jZXMuXG4gKlxuICogQ1NTLUNsYXNzZXM6XG4gKiAtICoqQ29kQmlfQ3VycmVuY3kqKlxuICogIFRoZSB7QGxpbmsgSFRNTElucHV0RWxlbWVudCB9cyB0YWdnZWQgd2l0aCB0aGlzIGNsYXNzIHdpbGwgYmUgZm9ybWF0dGVkIGZvciBDdXJyZW5jaWVzIHVzaW5nIENsZWF2ZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2FkQ29uZmlnKCk6IHZvaWQge1xuICB3aW5kb3cuY29kYmkubG9hZENvbmZpZyh7XG4gICAgdGFyZ2V0czogXCIuQ29kQmlfQ3VycmVuY3lcIixcbiAgICBGVU5DOiBcIkhUTUwuSW5wdXQuQ2xlYXZlXCIsXG4gICAgY29uZmlnOiBgXiR7SlNPTi5zdHJpbmdpZnkoe1xuICAgICAgbnVtZXJhbDogdHJ1ZSxcbiAgICAgIG51bWVyYWxUaG91c2FuZHNHcm91cFN0eWxlOiBcInRob3VzYW5kXCIsXG4gICAgICBudW1lcmFsRGVjaW1hbE1hcms6IFwiLFwiLFxuICAgICAgZGVsaW1pdGVyOiBcIlwiLFxuICAgIH0pXG4gICAgICAucmVwbGFjZShcIntcIiwgXCI8XCIpXG4gICAgICAucmVwbGFjZShcIn1cIiwgXCI+XCIpfWAsXG4gIH0pO1xufVxuXG5sb2FkQ29uZmlnKCk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBTU8sU0FBUyxhQUFtQjtBQUNqQyxTQUFPLE1BQU0sV0FBVztBQUFBLElBQ3RCLFNBQVM7QUFBQSxJQUNULE1BQU07QUFBQSxJQUNOLFFBQVEsSUFBSSxLQUFLLFVBQVU7QUFBQSxNQUN6QixTQUFTO0FBQUEsTUFDVCw0QkFBNEI7QUFBQSxNQUM1QixvQkFBb0I7QUFBQSxNQUNwQixXQUFXO0FBQUEsSUFDYixDQUFDLEVBQ0UsUUFBUSxLQUFLLEdBQUcsRUFDaEIsUUFBUSxLQUFLLEdBQUcsQ0FBQztBQUFBLEVBQ3RCLENBQUM7QUFDSDtBQUVBLFdBQVc7IiwKICAibmFtZXMiOiBbXQp9Cg==
