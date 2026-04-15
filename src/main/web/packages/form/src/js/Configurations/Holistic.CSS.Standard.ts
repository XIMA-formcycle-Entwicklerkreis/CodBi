/**
 * Registers a standard configuration that applies a standard CSS onto the form.
 * The CSS is customizable via four basic accents (ACCENT, SHADOW, HIGHLIGHT & INPUT_BORDER).
 * These basics may be set via the global variables "**CodBi_CSS_Scheme**" & "**CodBi_CSS_Darkmodescheme**".
 * If not set they'll be set to
 * "**CodBi_CSS_Scheme**" > ACCENT | 65B22E, SHADOW | 000000, HIGHLIGHT | FF8C00, INPUT_BORDER | 66C430 and
 * "**CodBi_CSS_Darkmodescheme**" > ACCENT | 65B22E, SHADOW | FF8C00, HIGHLIGHT | FF8C00, INPUT_BORDER | 073507.
 * The values are hexadecimal color-codes without an alpha. The alpha will be varied by this configuration thus mustn't
 * be set. */
export function loadConfig(): void {
  const scheme = document.querySelector('[ data-name = "CodBi_CSS_Scheme"');
  const schemeDarkmode = document.querySelector('[ data-name = "CodBi_CSS_Darkmodescheme"');

  window.codbi.loadConfig({
    targets: "head",
    FUNC: "HTML.CSS",
    Destination: "head",
    Replacements: scheme
      ? scheme.getAttribute("value")
      : "ACCENT | 65B22E, SHADOW | 000000, HIGHLIGHT | FF8C00, INPUT_BORDER | 66C430",
    DarkMode: schemeDarkmode
      ? schemeDarkmode.getAttribute("value")
      : "ACCENT | 65B22E, SHADOW | FF8C00, HIGHLIGHT | FF8C00, INPUT_BORDER | 073507",
    CSS: `
      input { min-width : 8em !important ;}

      .xm-form.modern DIV.XItem.XSelect LABEL  { font-size: 1.5em ;}
      /* #region Header, Footer & Logo */
      @media ( orientation : portrait ) {
          .XHeader h1 { margin : .5em ;}

          .XHeader span,
          .XHeader a,
          .XHeader p { margin : 1em ;}}

      div:has(.CodBi_CSS_Standard_Header_Logo) { margin-left : auto ;}

      @keyframes kfFadeIN_Logo {
          0%      { scale  : 1.1 ; opacity : 0 ;}
          60%     { scale : .99 ;}
          100%    { scale  : 1 ; opacity : 1 ;}}
      .CodBi_CSS_Standard_Header_Logo {
          animation       : kfFadeIN_Logo 1.5s forwards ease-in-out ;
          position        : relative ;
          width           : 30% ;
          opacity:        : 0 ;
          margin-top      : auto ;
          margin-bottom   : auto ;}

      .CodBi_CSS_Standard_Header_Logo img { width : 100% ;}

      .modern .CXHeader, .xm-form.modern .CXFooter { background-image : linear-gradient( 45deg, #ACCENT00 0%, #ACCENT30 50%, #ACCENT00 100% );}

      .XItem.XHeader #Header_Logo {
          margin-left     : auto ;
          margin-top      : auto ;
          margin-bottom   : auto ;}

      @keyframes kfFadeIN_Header {
          0%      { box-shadow : none ;}
          100%    { box-shadow : 0 .5vh .5vh #SHADOW ;}}
      .modern .CXHeader {
          margin-bottom               : 2em ;
          background-color            : white ;
          animation                   : kfFadeIN_Header 3s forwards ease-in-out ;
          border-bottom-left-radius   : .5em ;
          border-bottom-right-radius  : .5em ;}

      @keyframes kfFadeIN_Footer {
          0%      { box-shadow : none ;}
          100%    { box-shadow : 0 -.5vh .5vh #SHADOW ;}}
      .xm-form.modern .CXFooter {
          height                  : 100% ;
          padding-top             : 1em ;
          margin-top              : 2em ;
          background-color        : white ;
          animation               : kfFadeIN_Footer 3s forwards ease-in-out ;
          border-top-left-radius  : .5em ;
          border-top-right-radius : .5em ;}
      /* #endregion Header, Footer & Logo */
      /* #region Fieldset */
      .modern div.CXFieldSet:has(.CodBi.--HTML_Panel) { border : none !important ;}
      div.XItem.XContainer { background : unset !important ; background-color : transparent !important ; border-color : #ACCENT ;}

      .modern .CXFieldSet div.XFieldSetWrapper,
      .modern .XFieldSet .legend { background-color : transparent ; border: none ;}

      .modern div.CXFieldSet {
          transition          : .5s all ;
          padding-bottom      : 2em ;
          margin-bottom       : 1em ;
          border-style        : solid ;
          border-color        : #ACCENT30 ;
          background-color    : transparent ;
          border-radius       : .5em ;}

      .modern .XFieldSet:hover {
          background-image    : transparent ;
          transition          : .5s all ;}

      .modern .CXFieldSet:hover {
          background-image    : linear-gradient( 45deg, #ACCENT00 0%, #ACCENT20 50%, #ACCENT00 100% );
          transition          : all .5s ease-in-out ;
          border-color        : #ACCENT ;
          box-shadow          : 0 0 .5em #SHADOW ;}
      .modern .CXFieldSet:has( .XFieldSetWrapper .CodBi.--HTML_Panel ):hover {
          background-image    : none !important ;
          transition          : all .5s ease-in-out ;
          border-color        : #ACCENT ;
          box-shadow          : none ;}
      /* #endregion Fieldset */
      /* #region Animation - Input Underscore */
      @keyframes kfTextField {
          0% {
              border-width    : 0 ;
              border-color    : #INPUT_BORDER00 ;}
          100% {
              box-shadow                  : 0 0 .2em #SHADOW ;
              border-bottom-left-radius   : .2em ;
              border-bottom-right-radius  : .2em ;
              border-top-left-radius      : 0 ;
              border-top-right-radius     : 0 ;
              border-style                : solid ;
              border-bottom-width         : .5em ;
              border-color                : #ACCENT ;}}
      .XTextField:focus   { animation :.5s kfTextField forwards ease-in-out ; border-color : #ACCENT ; outline-color : #ACCENT ;}
      .CXTextField:focus  { opacity   : 0 ; }

      fieldset.XFieldSet:has(input.XTextField:focus) legend { transition : .5s all ; color : #ACCENT ; text-shadow : 0em 0 .05em #HIGHLIGHT ;}
      /* #endregion Animation - Input Underscore */
      /* #region Buttons */
      .xm-form.modern .XButtonList,
      .xm-form.modern .XButton { background-color : white ;}

      .xm-form.modern .XButtonList:hover,
      .xm-form.modern .XButton:hover {
          color               : #HIGHLIGHT ;
          transition          : .5s all ease-in-out ;
          background-color    : none ;
          border-radius       : .2em ;
          scale               : 1.05 ;
          box-shadow          : 0 0 .2em #ACCENT ;}
      /* #endregion Buttons */
      /* #region Inputs */
      .xm-form.modern input.XItem.XTextField,
      .xm-form.modern textarea.XItem.XTextArea  { border-radius : .5em ; box-shadow : 0 0 .25em #ACCENT ; background-color : transparent ;}
      /* #endregion Inputs */
      /* #region Document */
      body.modern.xm-body { background-color : white ;}
      /* #endregion Document */
      /* #region Print */
      .print.XSpan { font-size: 2em !important; line-height: 1em !important ; text-justify: auto;}

      @media print {
        .xm-form.modern DIV.XFieldSetWrapper,
        .xm-form.modern DIV.XItem.XContainer,
        CXFieldSet                              { border:none !important;}

        h1 { font-size:3em !important;}
        h2 { font-size: 2.5em !important;}

        .CXTextField { margin-bottom: 1.5em !important ;}

        .xm-form .xm-content div.print.XSpan { background-color: #ACCENT10 !important ;}

        label span,
        label span em { font-size:1.25em !important; line-height: 1.25em ; color: #ACCENT50 ;}
      }
      /* #endregion Print */
      /* #region Dark Mode */
      @media( prefers-color-scheme : dark ) {
        .LLAMA_AI_Hint,
        .LLAMA_Chat_AiHint { color: white !important ;}
        
        .modern input.XTextField.XItem { border-color : #ACCENT50 !important ;}

        legend,
        label,
        input   { color : #ACCENT !important ;}

        [ role = "presentation"] { background-color : transparent !important ;}
        /* #region Header, Footer & Logo */
        .modern .CXHeader, .xm-form.modern .CXFooter { background-image : linear-gradient( 45deg, #ACCENT_DM00 0%, #ACCENT_DM30 50%, #ACCENT_DM00 100% );}

        @keyframes kfFadeIN_Header {
          0%      { box-shadow : none ;}
          100%    { box-shadow : 0 .5vh .5vh #SHADOW_DM ;}}

        @keyframes kfFadeIN_Footer {
          0%      { box-shadow : none ;}
          100%    { box-shadow : 0 -.5vh .5vh #SHADOW_DM ;}}
        /* #endregion Header, Footer & Logo */
        /* #region Fieldset */
        .modern div.CXFieldSet:has(.CodBi.--HTML_Panel) { border : none !important ;}

        .modern div.CXFieldSet {
          padding-bottom      : 2em ;
          margin-bottom       : 1em ;
          border-style        : solid ;
          border-color        : #ACCENT30_DM ;
          background-color    : transparent ;
          box-shadow          : none ;
          border-radius       : .5em ;}

        .modern .CXFieldSet:hover {
          background-image    : linear-gradient( 45deg, #ACCENT_DM00 0%, #ACCENT_DM20 50%, #ACCENT_DM00 100% );
          transition          : all .5s ease-in-out ;
          border-color        : #ACCENT_DM ;
          box-shadow          : 0 0 .5em #SHADOW_DM ;}
        .modern .CXFieldSet:has( .XFieldSetWrapper .CodBi.--HTML_Panel ):hover {
          background-image    : none !important ;
          transition          : all .5s ease-in-out ;
          border-color        : #ACCENT ;
          box-shadow          : none ;}
        /* #endregion Fieldset */
        /* #region Animation - Input Underscore */
        @keyframes kfTextField {
          0% {
              border-width    : 0 ;
              border-color    : #INPUT_BORDER_DM00 !important ;}
          100% {
              box-shadow                  : 0 0 .2em #SHADOW_DM !important ;
              border-bottom-left-radius   : .2em ;
              border-bottom-right-radius  : .2em ;
              border-top-left-radius      : 0 ;
              border-top-right-radius     : 0 ;
              border-style                : solid ;
              border-bottom-width         : .5em ;
              border-color                : #HIGHLIGHT_DM !important ;}}
        .XTextField:focus { animation :.5s kfTextField forwards ease-in-out !important ; outline-color : #HIGHLIGHT_DM ;}

        fieldset.XFieldSet:has(input.XTextField:focus) legend { transition : .5s all !important ; color : #SHADOW_DM !important ; text-shadow : 0em 0 .05em #HIGHLIGHT_DM !important ;}
        /* #endregion Animation - Input Underscore */
        /* #region Buttons */
        .CodBi_HTML_Panel_Header,
        .xm-form.modern button    { color : #ACCENT_DM ; border-color : #HIGHLIGHT_DM ; background: linear-gradient(93deg,rgba(5, 5, 5, 1) 0%, rgba(56, 47, 47, 1) 23%, rgba(107, 83, 65, 1) 55%, rgba(56, 52, 52, 1) 90%, rgba(0, 0, 0, 1) 100%) !important ;}

        .xm-form.modern .XButtonList:hover,
        .xm-form.modern .XButton:hover {
          transition          : .5s all ease-in-out ;
          background-color    : none ;
          border-radius       : .2em ;
          scale               : 1.05 ;
          box-shadow          : 0 0 .2em #ACCENT_DM ;}
        /* #endregion Buttons */
        /* #region Inputs */
        select,
        select:focus { background-color : transparent !important ;}

        .xm-form.modern input.XItem.XTextField,
        .xm-form.modern textarea.XItem.XTextArea  { border-radius : .5em ; box-shadow : 0 0 .25em #ACCENT_DM !important ; background: none !important ; background-color : transparent !important ; }
        /* #endregion Inputs */
        /* #region Document */
        body.modern.xm-body { background-color : black ;}
        /* #endregion Document */
        /* #region Paragraphs etc. */
        p, h1, h2, h3, h4, h5, h6, ul, span { color : #ACCENT_DM ;}
        /* #endregion Paragraphs etc. */
        /* #region Print */
        @media print {
          .xm-form .xm-content div.print.XSpan { background-color: #ACCENT_DM10 !important ;}

          label span,
          label span em { color: #ACCENT_DM50 ;}}
        /* #endregion Print */
      }
      /* #endregion Dark Mode */
      /* #region Druck Einstellungen*/
      .xm-form.modern DIV.XFieldSetWrapper,
      .xm-form.modern DIV.XItem.XContainer,
      CXFieldSet                              { border:none !important;}

      .print.XSpan { font-size: 2em !important; line-height: 1em !important ; text-justify: auto;}

      @media print {
          h1 { font-size:3em !important;}
          h2 { font-size: 2.5em !important;}

          .CXTextField { margin-bottom: 1.5em !important ;}

          .xm-form .xm-content div.print.XSpan { background-color: #65b22e10 !important ;}

          label,
          label span,
          label span em { font-size:1.25em !important; color: #65b22e ;}

          .CXUpload *:not(label) { font-size: 1.25em !important ; margin-top : .5em ;}}
      /* #region PageBreak Handling */
      .xm-form.modern .dont_break { page-break-inside: avoid ;}

      .CXPage:first-child, .CXPage:not(:first-child) { page-break-before: avoid ;

      .CXTextField, .CXCheckbox, .CXSelect, .CXTextArea, .CXAppointment, .CXSignature, .CXUpload, .CXCaptcha, .CXMap { break-inside: avoid ;}

      .CXSelect .XDropDown, .CXTextField .XTextField, .CXTextArea .XTextArea, .CXSignature .XSignature { page-break-inside: avoid ;}
      
      .CXCheckbox { margin-left: 0 !important ; page-break-inside: avoid ;}
      /* #endregion PageBreak Handling */
      /* #endregion Druck Einstellungen*/

}`
      .replace(/\{/g, "<")
      .replace(/\}/g, ">")
      .replace(/\,/g, "§"),
  });
}

loadConfig();
