/**
 * Registers a standard configuration that turns every {@link HTMLFieldSetElement } into an CodBi-HTML-Panel
 * that has no definite **cbFolded** parameter. The functionality **HTML.Panel** therefore will show the panel unfolded.
 * Set **cbFolded** to TRUE on the {@link HTMLFieldSetElement }s that shall be folded instead or set the global Variable
 * **HTML_Panel_Folded** to set all {@link HTMLFieldSetElement }s to folded.
 *
 * General excluding CSS-Class available (**CodBi_XCL**).
 * Exclusive excluding CSS-Class available (**CodBi_XCL_FieldSetToPanel**) */
export function loadConfig(): void {
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
  });
}

loadConfig();
