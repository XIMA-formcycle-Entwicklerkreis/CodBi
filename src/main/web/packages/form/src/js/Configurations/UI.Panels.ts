/**
 * Registers standard configurations providing CodBi-"HTML.Panel"s
 *
 * CSS-Classes
 *  - **CodBi_HTML_Panel_Standard**
 *    A panel with shaded gray background for the auto generated \<h2> header that changes the title's color to darkgreen
 *    when unfolded. The content will appear through a popup animation.
 *
 *    **Usage:**
 *    Tag the {@link HTMLDivElement } or fieldset with the CSS-Class "CodBi_HTML_Panel_Standard" and set the attribute "cbAutoheaderTitle"
 *    to define the title showed in the header. */
export function loadConfig(): void {
  // #region CodBi_HTML_Panel_Standard
  window.codbi.loadConfigs([
    {
      targets: ".CodBi_HTML_Panel_Standard",
      FUNC: "HTML.Panel",
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
    },
    {
      targets: ".CodBi_HTML_Panel_Flat",
      FUNC: "HTML.Panel",
      CSSHeaderUnfolded:
        "position : relative ; box-shadow : none ; padding-left:2em ; height : 4em ; line-height : .25em ; color: darkorange ; border-radius : .5em ; transition : 2s all ; border : solid darkorange .25em; cursor : pointer ; background : #d9d9d9 ; background : linear-gradient(138deg,rgba(217, 217, 217, 0) 0%, rgba(255, 255, 255, .5) 24%, rgba(255, 255, 255, .8) 30%, rgba(214, 214, 214, 0) 100%); padding : .5em ; transition : .5s all ;",
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
        "padding-left:2em ; height : 4em ; line-height : .25em ; border-radius : .5em ; box-shadow : none ; border : solid green .25em; cursor : pointer ; background : #d9d9d9 ; background : linear-gradient(138deg,rgba(217, 217, 217, 0) 0%, rgba(255, 255, 255, .5) 24%, rgba(255, 255, 255, .8) 30%, rgba(214, 214, 214, 0) 100%); padding : .5em ; transition : .5s all ;",
    },
    {
      targets: ".CodBi_HTML_Panel_Minimal",
      FUNC: "HTML.Panel",
      CSSHeaderUnfolded:
        "position : relative ; box-shadow : none ; color : darkorange ; padding-left:2em ; height : 4em ; line-height : .25em ; border-radius : .5em ; transition : 2s all ; border-left : solid darkorange .25em;     border-right: solid darkorange .25em; border-bottom: solid grey .1em; border-top: solid grey .1em;cursor : pointer ; background : #d9d9d9 ; background : linear-gradient(138deg,rgba(217, 217, 217, 0) 0%, rgba(255, 255, 255, .5) 24%, rgba(255, 255, 255, .8) 30%, rgba(214, 214, 214, 0) 100%); padding : .5em ; transition : .5s all ;",
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
        "padding-left:2em ; height : 4em ; line-height : .25em ; border-radius : .5em ; box-shadow : none ; border : solid green .25em;    border-right: solid green .25em; border-bottom: solid grey .1em; border-top: solid grey .1em; cursor : pointer ; background : #d9d9d9 ; background : linear-gradient(138deg,rgba(217, 217, 217, 0) 0%, rgba(255, 255, 255, .5) 24%, rgba(255, 255, 255, .8) 30%, rgba(214, 214, 214, 0) 100%); padding : .5em ; transition : .5s all ;",
    },
  ]);
  // #endregion CodBi_HTML_Panel_Standard
}

loadConfig();
