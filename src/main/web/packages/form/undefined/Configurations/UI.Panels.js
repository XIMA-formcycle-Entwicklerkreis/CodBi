function e() {
  window.codbi.loadConfigs([
    {
      targets: ".CodBi_HTML_Panel_Standard",
      FUNC: "HTML.Panel",
      CSSHeaderHover: "filter:none;",
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
      CSSHeaderHover: "filter:none;",
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
      CSSHeaderHover: "filter:none;",
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
  ]),
    window.codbi.loadConfig({
      targets: ".CodBi_HTML_Panel_Index",
      FUNC: "HTML.Panel",
      CSSHeaderHover: "filter: drop-shadow( 0 0 5em green ); padding-left: 2em ;",
      CSSHeaderUnfolded:
        " height: 4em ; line-height: .5em; cursor: pointer; transition: .5s all !important; border-bottom-style: groove; border-color: lightgreen ; background: none !important ; background-image: none ; transition: .5s all ; ",
      AutoHeaderCSS:
        "width: fit-content ;height: 4em ; line-height: .5em; cursor: pointer; transition: .5s all; border-bottom-style: none; border-width:0; transition: .5s all ; background: none !important ; background-image: none ;",
      GenerateHeader: "TRUE",
      AutoheaderLevel: "2",
      CSSAnimFadeINPanel: "0% { opacity : 0 ; scale : 1.1 ;} 100% { opacity :1 ; scale : 1 ;}",
      CSSAnimFadeINPanelDuration: ".25s",
      CSSAnimFadeINPanelEasing: "ease-in",
    }),
    window.codbi.loadConfigs([
      { targets: ".CodBi_Accordion_A", FUNC: "HTML.Panel.Accordion", Accordion: "CodBi_Accordion_Set_A" },
      { targets: ".CodBi_Accordion_B", FUNC: "HTML.Panel.Accordion", Accordion: "CodBi_Accordion_Set_B" },
      { targets: ".CodBi_Accordion_C", FUNC: "HTML.Panel.Accordion", Accordion: "CodBi_Accordion_Set_C" },
      { targets: ".CodBi_Accordion_D", FUNC: "HTML.Panel.Accordion", Accordion: "CodBi_Accordion_Set_D" },
    ]);
}
e();
export { e as loadConfig };
