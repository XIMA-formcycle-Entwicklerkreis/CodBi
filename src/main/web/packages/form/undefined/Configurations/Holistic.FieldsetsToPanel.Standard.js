// src/js/Configurations/Holistic.FieldsetsToPanel.Standard.ts
function loadConfig() {
  window.codbi.loadConfig({
    targets: "fieldset:not(.CodBi_XCL):not(.CodBi_XCL_FieldSetToPanel)",
    FUNC: "HTML.Panel",
    Folded: false,
    CSSHeaderUnfolded:
      "position : relative ; box-shadow : 0 0em .5em black ; padding-left:2em ; height : 4em ; line-height : .5em ; border-radius : .5em ; transition : 2s all ; border : solid green .1em; cursor : pointer ; background : #d9d9d9 ; background : linear-gradient(138deg,rgba(217, 217, 217, 1) 0%, rgba(255, 255, 255, 1) 24%, rgba(255, 255, 255, 1) 82%, rgba(214, 214, 214, 1) 100%); padding : .5em ; transition : .5s all ;",
    CSSAfterHeader:
      "margin-left : auto ; display : none ; color : darkgreen ; filter : drop-shadow( 0 0 .1em darkorange);",
    WrapperCSS: "border:none;",
    CSSAnimFadeINPanel:
      "0% { opacity : 0 ; scale : 0 ;} 30% { scale : 1.1 ;} 60% { scale : 1 ;} 100% { opacity :1 ; scale : 1 ;}",
    CSSAnimFadeINPanelDuration: "1s",
    CSSAnimFadeINPanelEasing: "ease-in",
    GenerateHeader: "TRUE",
    AutoheaderTitle: "",
    AutoHeaderLevel: "2",
    AutoheaderCSS:
      "padding-left:2em ; height : 4em ; line-height : .5em ; border-radius : .5em ; box-shadow : 0 0 .5em black ; border : solid green .1em; cursor : pointer ; background : #d9d9d9 ; background : linear-gradient(138deg,rgba(217, 217, 217, 1) 0%, rgba(255, 255, 255, 1) 24%, rgba(255, 255, 255, 1) 82%, rgba(214, 214, 214, 1) 100%); padding : .5em ; transition : .5s all ;",
    ScrollBlock: "start",
  });
}
loadConfig();
export { loadConfig };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjL2pzL0NvbmZpZ3VyYXRpb25zL0hvbGlzdGljLkZpZWxkc2V0c1RvUGFuZWwuU3RhbmRhcmQudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8qKlxuICogUmVnaXN0ZXJzIGEgc3RhbmRhcmQgY29uZmlndXJhdGlvbiB0aGF0IHR1cm5zIGV2ZXJ5IHtAbGluayBIVE1MRmllbGRTZXRFbGVtZW50IH0gaW50byBhbiBDb2RCaS1IVE1MLVBhbmVsXG4gKiB0aGF0IGhhcyBubyBkZWZpbml0ZSAqKmNiRm9sZGVkKiogcGFyYW1ldGVyLiBUaGUgZnVuY3Rpb25hbGl0eSAqKkhUTUwuUGFuZWwqKiB0aGVyZWZvcmUgd2lsbCBzaG93IHRoZSBwYW5lbCB1bmZvbGRlZC5cbiAqIFNldCAqKmNiRm9sZGVkKiogdG8gVFJVRSBvbiB0aGUge0BsaW5rIEhUTUxGaWVsZFNldEVsZW1lbnQgfXMgdGhhdCBzaGFsbCBiZSBmb2xkZWQgaW5zdGVhZCBvciBzZXQgdGhlIGdsb2JhbCBWYXJpYWJsZVxuICogKipIVE1MX1BhbmVsX0ZvbGRlZCoqIHRvIHNldCBhbGwge0BsaW5rIEhUTUxGaWVsZFNldEVsZW1lbnQgfXMgdG8gZm9sZGVkLlxuICpcbiAqIEdlbmVyYWwgZXhjbHVkaW5nIENTUy1DbGFzcyBhdmFpbGFibGUgKCoqQ29kQmlfWENMKiopLlxuICogRXhjbHVzaXZlIGV4Y2x1ZGluZyBDU1MtQ2xhc3MgYXZhaWxhYmxlICgqKkNvZEJpX1hDTF9GaWVsZFNldFRvUGFuZWwqKikgKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2FkQ29uZmlnKCk6IHZvaWQge1xuICB3aW5kb3cuY29kYmkubG9hZENvbmZpZyh7XG4gICAgdGFyZ2V0czogXCJmaWVsZHNldDpub3QoLkNvZEJpX1hDTCk6bm90KC5Db2RCaV9YQ0xfRmllbGRTZXRUb1BhbmVsKVwiLFxuICAgIEZVTkM6IFwiSFRNTC5QYW5lbFwiLFxuICAgIEZvbGRlZDogZmFsc2UsXG4gICAgQ1NTSGVhZGVyVW5mb2xkZWQ6XG4gICAgICBcInBvc2l0aW9uIDogcmVsYXRpdmUgOyBib3gtc2hhZG93IDogMCAwZW0gLjVlbSBibGFjayA7IHBhZGRpbmctbGVmdDoyZW0gOyBoZWlnaHQgOiA0ZW0gOyBsaW5lLWhlaWdodCA6IC41ZW0gOyBib3JkZXItcmFkaXVzIDogLjVlbSA7IHRyYW5zaXRpb24gOiAycyBhbGwgOyBib3JkZXIgOiBzb2xpZCBncmVlbiAuMWVtOyBjdXJzb3IgOiBwb2ludGVyIDsgYmFja2dyb3VuZCA6ICNkOWQ5ZDkgOyBiYWNrZ3JvdW5kIDogbGluZWFyLWdyYWRpZW50KDEzOGRlZyxyZ2JhKDIxNywgMjE3LCAyMTcsIDEpIDAlLCByZ2JhKDI1NSwgMjU1LCAyNTUsIDEpIDI0JSwgcmdiYSgyNTUsIDI1NSwgMjU1LCAxKSA4MiUsIHJnYmEoMjE0LCAyMTQsIDIxNCwgMSkgMTAwJSk7IHBhZGRpbmcgOiAuNWVtIDsgdHJhbnNpdGlvbiA6IC41cyBhbGwgO1wiLFxuICAgIENTU0FmdGVySGVhZGVyOlxuICAgICAgXCJtYXJnaW4tbGVmdCA6IGF1dG8gOyBkaXNwbGF5IDogbm9uZSA7IGNvbG9yIDogZGFya2dyZWVuIDsgZmlsdGVyIDogZHJvcC1zaGFkb3coIDAgMCAuMWVtIGRhcmtvcmFuZ2UpO1wiLFxuICAgIFdyYXBwZXJDU1M6IFwiYm9yZGVyOm5vbmU7XCIsXG4gICAgQ1NTQW5pbUZhZGVJTlBhbmVsOlxuICAgICAgXCIwJSB7IG9wYWNpdHkgOiAwIDsgc2NhbGUgOiAwIDt9IDMwJSB7IHNjYWxlIDogMS4xIDt9IDYwJSB7IHNjYWxlIDogMSA7fSAxMDAlIHsgb3BhY2l0eSA6MSA7IHNjYWxlIDogMSA7fVwiLFxuICAgIENTU0FuaW1GYWRlSU5QYW5lbER1cmF0aW9uOiBcIjFzXCIsXG4gICAgQ1NTQW5pbUZhZGVJTlBhbmVsRWFzaW5nOiBcImVhc2UtaW5cIixcbiAgICBHZW5lcmF0ZUhlYWRlcjogXCJUUlVFXCIsXG4gICAgQXV0b2hlYWRlclRpdGxlOiBcIlwiLFxuICAgIEF1dG9IZWFkZXJMZXZlbDogXCIyXCIsXG4gICAgQXV0b2hlYWRlckNTUzpcbiAgICAgIFwicGFkZGluZy1sZWZ0OjJlbSA7IGhlaWdodCA6IDRlbSA7IGxpbmUtaGVpZ2h0IDogLjVlbSA7IGJvcmRlci1yYWRpdXMgOiAuNWVtIDsgYm94LXNoYWRvdyA6IDAgMCAuNWVtIGJsYWNrIDsgYm9yZGVyIDogc29saWQgZ3JlZW4gLjFlbTsgY3Vyc29yIDogcG9pbnRlciA7IGJhY2tncm91bmQgOiAjZDlkOWQ5IDsgYmFja2dyb3VuZCA6IGxpbmVhci1ncmFkaWVudCgxMzhkZWcscmdiYSgyMTcsIDIxNywgMjE3LCAxKSAwJSwgcmdiYSgyNTUsIDI1NSwgMjU1LCAxKSAyNCUsIHJnYmEoMjU1LCAyNTUsIDI1NSwgMSkgODIlLCByZ2JhKDIxNCwgMjE0LCAyMTQsIDEpIDEwMCUpOyBwYWRkaW5nIDogLjVlbSA7IHRyYW5zaXRpb24gOiAuNXMgYWxsIDtcIixcbiAgICBTY3JvbGxCbG9jazogXCJzdGFydFwiLFxuICB9KTtcbn1cblxubG9hZENvbmZpZygpO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQVFPLFNBQVMsYUFBbUI7QUFDakMsU0FBTyxNQUFNLFdBQVc7QUFBQSxJQUN0QixTQUFTO0FBQUEsSUFDVCxNQUFNO0FBQUEsSUFDTixRQUFRO0FBQUEsSUFDUixtQkFDRTtBQUFBLElBQ0YsZ0JBQ0U7QUFBQSxJQUNGLFlBQVk7QUFBQSxJQUNaLG9CQUNFO0FBQUEsSUFDRiw0QkFBNEI7QUFBQSxJQUM1QiwwQkFBMEI7QUFBQSxJQUMxQixnQkFBZ0I7QUFBQSxJQUNoQixpQkFBaUI7QUFBQSxJQUNqQixpQkFBaUI7QUFBQSxJQUNqQixlQUNFO0FBQUEsSUFDRixhQUFhO0FBQUEsRUFDZixDQUFDO0FBQ0g7QUFFQSxXQUFXOyIsCiAgIm5hbWVzIjogW10KfQo=
