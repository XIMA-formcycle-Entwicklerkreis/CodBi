// src/js/Configurations/Holistic.CSS.Standard.ts
function loadConfig() {
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
        .xm-form.modern button { color : #ACCENT_DM ; border-color : #HIGHLIGHT_DM ; background: linear-gradient(93deg,rgba(5, 5, 5, 1) 0%, rgba(56, 47, 47, 1) 23%, rgba(107, 83, 65, 1) 55%, rgba(56, 52, 52, 1) 90%, rgba(0, 0, 0, 1) 100%) !important ;}

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
        .xm-form.modern textarea.XItem.XTextArea  { border-radius : .5em ; box-shadow : 0 0 .25em #ACCENT_DM !important ; background-color : transparent !important ;}
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
      .replace(/\,/g, "\xA7"),
  });
}
loadConfig();
export { loadConfig };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjL2pzL0NvbmZpZ3VyYXRpb25zL0hvbGlzdGljLkNTUy5TdGFuZGFyZC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLyoqXG4gKiBSZWdpc3RlcnMgYSBzdGFuZGFyZCBjb25maWd1cmF0aW9uIHRoYXQgYXBwbGllcyBhIHN0YW5kYXJkIENTUyBvbnRvIHRoZSBmb3JtLlxuICogVGhlIENTUyBpcyBjdXN0b21pemFibGUgdmlhIGZvdXIgYmFzaWMgYWNjZW50cyAoQUNDRU5ULCBTSEFET1csIEhJR0hMSUdIVCAmIElOUFVUX0JPUkRFUikuXG4gKiBUaGVzZSBiYXNpY3MgbWF5IGJlIHNldCB2aWEgdGhlIGdsb2JhbCB2YXJpYWJsZXMgXCIqKkNvZEJpX0NTU19TY2hlbWUqKlwiICYgXCIqKkNvZEJpX0NTU19EYXJrbW9kZXNjaGVtZSoqXCIuXG4gKiBJZiBub3Qgc2V0IHRoZXknbGwgYmUgc2V0IHRvXG4gKiBcIioqQ29kQmlfQ1NTX1NjaGVtZSoqXCIgPiBBQ0NFTlQgfCA2NUIyMkUsIFNIQURPVyB8IDAwMDAwMCwgSElHSExJR0hUIHwgRkY4QzAwLCBJTlBVVF9CT1JERVIgfCA2NkM0MzAgYW5kXG4gKiBcIioqQ29kQmlfQ1NTX0Rhcmttb2Rlc2NoZW1lKipcIiA+IEFDQ0VOVCB8IDY1QjIyRSwgU0hBRE9XIHwgRkY4QzAwLCBISUdITElHSFQgfCBGRjhDMDAsIElOUFVUX0JPUkRFUiB8IDA3MzUwNy5cbiAqIFRoZSB2YWx1ZXMgYXJlIGhleGFkZWNpbWFsIGNvbG9yLWNvZGVzIHdpdGhvdXQgYW4gYWxwaGEuIFRoZSBhbHBoYSB3aWxsIGJlIHZhcmllZCBieSB0aGlzIGNvbmZpZ3VyYXRpb24gdGh1cyBtdXN0bid0XG4gKiBiZSBzZXQuICovXG5leHBvcnQgZnVuY3Rpb24gbG9hZENvbmZpZygpOiB2b2lkIHtcbiAgY29uc3Qgc2NoZW1lID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignWyBkYXRhLW5hbWUgPSBcIkNvZEJpX0NTU19TY2hlbWVcIicpO1xuICBjb25zdCBzY2hlbWVEYXJrbW9kZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ1sgZGF0YS1uYW1lID0gXCJDb2RCaV9DU1NfRGFya21vZGVzY2hlbWVcIicpO1xuXG4gIHdpbmRvdy5jb2RiaS5sb2FkQ29uZmlnKHtcbiAgICB0YXJnZXRzOiBcImhlYWRcIixcbiAgICBGVU5DOiBcIkhUTUwuQ1NTXCIsXG4gICAgRGVzdGluYXRpb246IFwiaGVhZFwiLFxuICAgIFJlcGxhY2VtZW50czogc2NoZW1lXG4gICAgICA/IHNjaGVtZS5nZXRBdHRyaWJ1dGUoXCJ2YWx1ZVwiKVxuICAgICAgOiBcIkFDQ0VOVCB8IDY1QjIyRSwgU0hBRE9XIHwgMDAwMDAwLCBISUdITElHSFQgfCBGRjhDMDAsIElOUFVUX0JPUkRFUiB8IDY2QzQzMFwiLFxuICAgIERhcmtNb2RlOiBzY2hlbWVEYXJrbW9kZVxuICAgICAgPyBzY2hlbWVEYXJrbW9kZS5nZXRBdHRyaWJ1dGUoXCJ2YWx1ZVwiKVxuICAgICAgOiBcIkFDQ0VOVCB8IDY1QjIyRSwgU0hBRE9XIHwgRkY4QzAwLCBISUdITElHSFQgfCBGRjhDMDAsIElOUFVUX0JPUkRFUiB8IDA3MzUwN1wiLFxuICAgIENTUzogYFxuICAgICAgaW5wdXQgeyBtaW4td2lkdGggOiA4ZW0gIWltcG9ydGFudCA7fVxuXG4gICAgICAueG0tZm9ybS5tb2Rlcm4gRElWLlhJdGVtLlhTZWxlY3QgTEFCRUwgIHsgZm9udC1zaXplOiAxLjVlbSA7fVxuICAgICAgLyogI3JlZ2lvbiBIZWFkZXIsIEZvb3RlciAmIExvZ28gKi9cbiAgICAgIEBtZWRpYSAoIG9yaWVudGF0aW9uIDogcG9ydHJhaXQgKSB7XG4gICAgICAgICAgLlhIZWFkZXIgaDEgeyBtYXJnaW4gOiAuNWVtIDt9XG5cbiAgICAgICAgICAuWEhlYWRlciBzcGFuLFxuICAgICAgICAgIC5YSGVhZGVyIGEsXG4gICAgICAgICAgLlhIZWFkZXIgcCB7IG1hcmdpbiA6IDFlbSA7fX1cblxuICAgICAgZGl2OmhhcyguQ29kQmlfQ1NTX1N0YW5kYXJkX0hlYWRlcl9Mb2dvKSB7IG1hcmdpbi1sZWZ0IDogYXV0byA7fVxuXG4gICAgICBAa2V5ZnJhbWVzIGtmRmFkZUlOX0xvZ28ge1xuICAgICAgICAgIDAlICAgICAgeyBzY2FsZSAgOiAxLjEgOyBvcGFjaXR5IDogMCA7fVxuICAgICAgICAgIDYwJSAgICAgeyBzY2FsZSA6IC45OSA7fVxuICAgICAgICAgIDEwMCUgICAgeyBzY2FsZSAgOiAxIDsgb3BhY2l0eSA6IDEgO319XG4gICAgICAuQ29kQmlfQ1NTX1N0YW5kYXJkX0hlYWRlcl9Mb2dvIHtcbiAgICAgICAgICBhbmltYXRpb24gICAgICAgOiBrZkZhZGVJTl9Mb2dvIDEuNXMgZm9yd2FyZHMgZWFzZS1pbi1vdXQgO1xuICAgICAgICAgIHBvc2l0aW9uICAgICAgICA6IHJlbGF0aXZlIDtcbiAgICAgICAgICB3aWR0aCAgICAgICAgICAgOiAzMCUgO1xuICAgICAgICAgIG1hcmdpbi10b3AgICAgICA6IGF1dG8gO1xuICAgICAgICAgIG1hcmdpbi1ib3R0b20gICA6IGF1dG8gO31cblxuICAgICAgLkNvZEJpX0NTU19TdGFuZGFyZF9IZWFkZXJfTG9nbyBpbWcgeyB3aWR0aCA6IDEwMCUgO31cblxuICAgICAgLm1vZGVybiAuQ1hIZWFkZXIsIC54bS1mb3JtLm1vZGVybiAuQ1hGb290ZXIgeyBiYWNrZ3JvdW5kLWltYWdlIDogbGluZWFyLWdyYWRpZW50KCA0NWRlZywgI0FDQ0VOVDAwIDAlLCAjQUNDRU5UMzAgNTAlLCAjQUNDRU5UMDAgMTAwJSApO31cblxuICAgICAgLlhJdGVtLlhIZWFkZXIgI0hlYWRlcl9Mb2dvIHtcbiAgICAgICAgICBtYXJnaW4tbGVmdCAgICAgOiBhdXRvIDtcbiAgICAgICAgICBtYXJnaW4tdG9wICAgICAgOiBhdXRvIDtcbiAgICAgICAgICBtYXJnaW4tYm90dG9tICAgOiBhdXRvIDt9XG5cbiAgICAgIEBrZXlmcmFtZXMga2ZGYWRlSU5fSGVhZGVyIHtcbiAgICAgICAgICAwJSAgICAgIHsgYm94LXNoYWRvdyA6IG5vbmUgO31cbiAgICAgICAgICAxMDAlICAgIHsgYm94LXNoYWRvdyA6IDAgLjV2aCAuNXZoICNTSEFET1cgO319XG4gICAgICAubW9kZXJuIC5DWEhlYWRlciB7XG4gICAgICAgICAgbWFyZ2luLWJvdHRvbSAgICAgICAgICAgICAgIDogMmVtIDtcbiAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yICAgICAgICAgICAgOiB3aGl0ZSA7XG4gICAgICAgICAgYW5pbWF0aW9uICAgICAgICAgICAgICAgICAgIDoga2ZGYWRlSU5fSGVhZGVyIDNzIGZvcndhcmRzIGVhc2UtaW4tb3V0IDtcbiAgICAgICAgICBib3JkZXItYm90dG9tLWxlZnQtcmFkaXVzICAgOiAuNWVtIDtcbiAgICAgICAgICBib3JkZXItYm90dG9tLXJpZ2h0LXJhZGl1cyAgOiAuNWVtIDt9XG5cbiAgICAgIEBrZXlmcmFtZXMga2ZGYWRlSU5fRm9vdGVyIHtcbiAgICAgICAgICAwJSAgICAgIHsgYm94LXNoYWRvdyA6IG5vbmUgO31cbiAgICAgICAgICAxMDAlICAgIHsgYm94LXNoYWRvdyA6IDAgLS41dmggLjV2aCAjU0hBRE9XIDt9fVxuICAgICAgLnhtLWZvcm0ubW9kZXJuIC5DWEZvb3RlciB7XG4gICAgICAgICAgaGVpZ2h0ICAgICAgICAgICAgICAgICAgOiAxMDAlIDtcbiAgICAgICAgICBwYWRkaW5nLXRvcCAgICAgICAgICAgICA6IDFlbSA7XG4gICAgICAgICAgbWFyZ2luLXRvcCAgICAgICAgICAgICAgOiAyZW0gO1xuICAgICAgICAgIGJhY2tncm91bmQtY29sb3IgICAgICAgIDogd2hpdGUgO1xuICAgICAgICAgIGFuaW1hdGlvbiAgICAgICAgICAgICAgIDoga2ZGYWRlSU5fRm9vdGVyIDNzIGZvcndhcmRzIGVhc2UtaW4tb3V0IDtcbiAgICAgICAgICBib3JkZXItdG9wLWxlZnQtcmFkaXVzICA6IC41ZW0gO1xuICAgICAgICAgIGJvcmRlci10b3AtcmlnaHQtcmFkaXVzIDogLjVlbSA7fVxuICAgICAgLyogI2VuZHJlZ2lvbiBIZWFkZXIsIEZvb3RlciAmIExvZ28gKi9cbiAgICAgIC8qICNyZWdpb24gRmllbGRzZXQgKi9cbiAgICAgIC5tb2Rlcm4gZGl2LkNYRmllbGRTZXQ6aGFzKC5Db2RCaS4tLUhUTUxfUGFuZWwpIHsgYm9yZGVyIDogbm9uZSAhaW1wb3J0YW50IDt9XG4gICAgICBkaXYuWEl0ZW0uWENvbnRhaW5lciB7IGJhY2tncm91bmQgOiB1bnNldCAhaW1wb3J0YW50IDsgYmFja2dyb3VuZC1jb2xvciA6IHRyYW5zcGFyZW50ICFpbXBvcnRhbnQgOyBib3JkZXItY29sb3IgOiAjQUNDRU5UIDt9XG5cbiAgICAgIC5tb2Rlcm4gLkNYRmllbGRTZXQgZGl2LlhGaWVsZFNldFdyYXBwZXIsXG4gICAgICAubW9kZXJuIC5YRmllbGRTZXQgLmxlZ2VuZCB7IGJhY2tncm91bmQtY29sb3IgOiB0cmFuc3BhcmVudCA7IGJvcmRlcjogbm9uZSA7fVxuXG4gICAgICAubW9kZXJuIGRpdi5DWEZpZWxkU2V0IHtcbiAgICAgICAgICB0cmFuc2l0aW9uICAgICAgICAgIDogLjVzIGFsbCA7XG4gICAgICAgICAgcGFkZGluZy1ib3R0b20gICAgICA6IDJlbSA7XG4gICAgICAgICAgbWFyZ2luLWJvdHRvbSAgICAgICA6IDFlbSA7XG4gICAgICAgICAgYm9yZGVyLXN0eWxlICAgICAgICA6IHNvbGlkIDtcbiAgICAgICAgICBib3JkZXItY29sb3IgICAgICAgIDogI0FDQ0VOVDMwIDtcbiAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yICAgIDogdHJhbnNwYXJlbnQgO1xuICAgICAgICAgIGJvcmRlci1yYWRpdXMgICAgICAgOiAuNWVtIDt9XG5cbiAgICAgIC5tb2Rlcm4gLlhGaWVsZFNldDpob3ZlciB7XG4gICAgICAgICAgYmFja2dyb3VuZC1pbWFnZSAgICA6IHRyYW5zcGFyZW50IDtcbiAgICAgICAgICB0cmFuc2l0aW9uICAgICAgICAgIDogLjVzIGFsbCA7fVxuXG4gICAgICAubW9kZXJuIC5DWEZpZWxkU2V0OmhvdmVyIHtcbiAgICAgICAgICBiYWNrZ3JvdW5kLWltYWdlICAgIDogbGluZWFyLWdyYWRpZW50KCA0NWRlZywgI0FDQ0VOVDAwIDAlLCAjQUNDRU5UMjAgNTAlLCAjQUNDRU5UMDAgMTAwJSApO1xuICAgICAgICAgIHRyYW5zaXRpb24gICAgICAgICAgOiBhbGwgLjVzIGVhc2UtaW4tb3V0IDtcbiAgICAgICAgICBib3JkZXItY29sb3IgICAgICAgIDogI0FDQ0VOVCA7XG4gICAgICAgICAgYm94LXNoYWRvdyAgICAgICAgICA6IDAgMCAuNWVtICNTSEFET1cgO31cbiAgICAgIC5tb2Rlcm4gLkNYRmllbGRTZXQ6aGFzKCAuWEZpZWxkU2V0V3JhcHBlciAuQ29kQmkuLS1IVE1MX1BhbmVsICk6aG92ZXIge1xuICAgICAgICAgIGJhY2tncm91bmQtaW1hZ2UgICAgOiBub25lICFpbXBvcnRhbnQgO1xuICAgICAgICAgIHRyYW5zaXRpb24gICAgICAgICAgOiBhbGwgLjVzIGVhc2UtaW4tb3V0IDtcbiAgICAgICAgICBib3JkZXItY29sb3IgICAgICAgIDogI0FDQ0VOVCA7XG4gICAgICAgICAgYm94LXNoYWRvdyAgICAgICAgICA6IG5vbmUgO31cbiAgICAgIC8qICNlbmRyZWdpb24gRmllbGRzZXQgKi9cbiAgICAgIC8qICNyZWdpb24gQW5pbWF0aW9uIC0gSW5wdXQgVW5kZXJzY29yZSAqL1xuICAgICAgQGtleWZyYW1lcyBrZlRleHRGaWVsZCB7XG4gICAgICAgICAgMCUge1xuICAgICAgICAgICAgICBib3JkZXItd2lkdGggICAgOiAwIDtcbiAgICAgICAgICAgICAgYm9yZGVyLWNvbG9yICAgIDogI0lOUFVUX0JPUkRFUjAwIDt9XG4gICAgICAgICAgMTAwJSB7XG4gICAgICAgICAgICAgIGJveC1zaGFkb3cgICAgICAgICAgICAgICAgICA6IDAgMCAuMmVtICNTSEFET1cgO1xuICAgICAgICAgICAgICBib3JkZXItYm90dG9tLWxlZnQtcmFkaXVzICAgOiAuMmVtIDtcbiAgICAgICAgICAgICAgYm9yZGVyLWJvdHRvbS1yaWdodC1yYWRpdXMgIDogLjJlbSA7XG4gICAgICAgICAgICAgIGJvcmRlci10b3AtbGVmdC1yYWRpdXMgICAgICA6IDAgO1xuICAgICAgICAgICAgICBib3JkZXItdG9wLXJpZ2h0LXJhZGl1cyAgICAgOiAwIDtcbiAgICAgICAgICAgICAgYm9yZGVyLXN0eWxlICAgICAgICAgICAgICAgIDogc29saWQgO1xuICAgICAgICAgICAgICBib3JkZXItYm90dG9tLXdpZHRoICAgICAgICAgOiAuNWVtIDtcbiAgICAgICAgICAgICAgYm9yZGVyLWNvbG9yICAgICAgICAgICAgICAgIDogI0FDQ0VOVCA7fX1cbiAgICAgIC5YVGV4dEZpZWxkOmZvY3VzICAgeyBhbmltYXRpb24gOi41cyBrZlRleHRGaWVsZCBmb3J3YXJkcyBlYXNlLWluLW91dCA7IGJvcmRlci1jb2xvciA6ICNBQ0NFTlQgOyBvdXRsaW5lLWNvbG9yIDogI0FDQ0VOVCA7fVxuICAgICAgLkNYVGV4dEZpZWxkOmZvY3VzICB7IG9wYWNpdHkgICA6IDAgOyB9XG5cbiAgICAgIGZpZWxkc2V0LlhGaWVsZFNldDpoYXMoaW5wdXQuWFRleHRGaWVsZDpmb2N1cykgbGVnZW5kIHsgdHJhbnNpdGlvbiA6IC41cyBhbGwgOyBjb2xvciA6ICNBQ0NFTlQgOyB0ZXh0LXNoYWRvdyA6IDBlbSAwIC4wNWVtICNISUdITElHSFQgO31cbiAgICAgIC8qICNlbmRyZWdpb24gQW5pbWF0aW9uIC0gSW5wdXQgVW5kZXJzY29yZSAqL1xuICAgICAgLyogI3JlZ2lvbiBCdXR0b25zICovXG4gICAgICAueG0tZm9ybS5tb2Rlcm4gLlhCdXR0b25MaXN0LFxuICAgICAgLnhtLWZvcm0ubW9kZXJuIC5YQnV0dG9uIHsgYmFja2dyb3VuZC1jb2xvciA6IHdoaXRlIDt9XG5cbiAgICAgIC54bS1mb3JtLm1vZGVybiAuWEJ1dHRvbkxpc3Q6aG92ZXIsXG4gICAgICAueG0tZm9ybS5tb2Rlcm4gLlhCdXR0b246aG92ZXIge1xuICAgICAgICAgIGNvbG9yICAgICAgICAgICAgICAgOiAjSElHSExJR0hUIDtcbiAgICAgICAgICB0cmFuc2l0aW9uICAgICAgICAgIDogLjVzIGFsbCBlYXNlLWluLW91dCA7XG4gICAgICAgICAgYmFja2dyb3VuZC1jb2xvciAgICA6IG5vbmUgO1xuICAgICAgICAgIGJvcmRlci1yYWRpdXMgICAgICAgOiAuMmVtIDtcbiAgICAgICAgICBzY2FsZSAgICAgICAgICAgICAgIDogMS4wNSA7XG4gICAgICAgICAgYm94LXNoYWRvdyAgICAgICAgICA6IDAgMCAuMmVtICNBQ0NFTlQgO31cbiAgICAgIC8qICNlbmRyZWdpb24gQnV0dG9ucyAqL1xuICAgICAgLyogI3JlZ2lvbiBJbnB1dHMgKi9cbiAgICAgIC54bS1mb3JtLm1vZGVybiBpbnB1dC5YSXRlbS5YVGV4dEZpZWxkLFxuICAgICAgLnhtLWZvcm0ubW9kZXJuIHRleHRhcmVhLlhJdGVtLlhUZXh0QXJlYSAgeyBib3JkZXItcmFkaXVzIDogLjVlbSA7IGJveC1zaGFkb3cgOiAwIDAgLjI1ZW0gI0FDQ0VOVCA7IGJhY2tncm91bmQtY29sb3IgOiB0cmFuc3BhcmVudCA7fVxuICAgICAgLyogI2VuZHJlZ2lvbiBJbnB1dHMgKi9cbiAgICAgIC8qICNyZWdpb24gRG9jdW1lbnQgKi9cbiAgICAgIGJvZHkubW9kZXJuLnhtLWJvZHkgeyBiYWNrZ3JvdW5kLWNvbG9yIDogd2hpdGUgO31cbiAgICAgIC8qICNlbmRyZWdpb24gRG9jdW1lbnQgKi9cbiAgICAgIC8qICNyZWdpb24gUHJpbnQgKi9cbiAgICAgIC5wcmludC5YU3BhbiB7IGZvbnQtc2l6ZTogMmVtICFpbXBvcnRhbnQ7IGxpbmUtaGVpZ2h0OiAxZW0gIWltcG9ydGFudCA7IHRleHQtanVzdGlmeTogYXV0bzt9XG5cbiAgICAgIEBtZWRpYSBwcmludCB7XG4gICAgICAgIC54bS1mb3JtLm1vZGVybiBESVYuWEZpZWxkU2V0V3JhcHBlcixcbiAgICAgICAgLnhtLWZvcm0ubW9kZXJuIERJVi5YSXRlbS5YQ29udGFpbmVyLFxuICAgICAgICBDWEZpZWxkU2V0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBib3JkZXI6bm9uZSAhaW1wb3J0YW50O31cblxuICAgICAgICBoMSB7IGZvbnQtc2l6ZTozZW0gIWltcG9ydGFudDt9XG4gICAgICAgIGgyIHsgZm9udC1zaXplOiAyLjVlbSAhaW1wb3J0YW50O31cblxuICAgICAgICAuQ1hUZXh0RmllbGQgeyBtYXJnaW4tYm90dG9tOiAxLjVlbSAhaW1wb3J0YW50IDt9XG5cbiAgICAgICAgLnhtLWZvcm0gLnhtLWNvbnRlbnQgZGl2LnByaW50LlhTcGFuIHsgYmFja2dyb3VuZC1jb2xvcjogI0FDQ0VOVDEwICFpbXBvcnRhbnQgO31cblxuICAgICAgICBsYWJlbCBzcGFuLFxuICAgICAgICBsYWJlbCBzcGFuIGVtIHsgZm9udC1zaXplOjEuMjVlbSAhaW1wb3J0YW50OyBsaW5lLWhlaWdodDogMS4yNWVtIDsgY29sb3I6ICNBQ0NFTlQ1MCA7fVxuICAgICAgfVxuICAgICAgLyogI2VuZHJlZ2lvbiBQcmludCAqL1xuICAgICAgLyogI3JlZ2lvbiBEYXJrIE1vZGUgKi9cbiAgICAgIEBtZWRpYSggcHJlZmVycy1jb2xvci1zY2hlbWUgOiBkYXJrICkge1xuICAgICAgICAubW9kZXJuIGlucHV0LlhUZXh0RmllbGQuWEl0ZW0geyBib3JkZXItY29sb3IgOiAjQUNDRU5UNTAgIWltcG9ydGFudCA7fVxuXG4gICAgICAgIGxlZ2VuZCxcbiAgICAgICAgbGFiZWwsXG4gICAgICAgIGlucHV0ICAgeyBjb2xvciA6ICNBQ0NFTlQgIWltcG9ydGFudCA7fVxuXG4gICAgICAgIFsgcm9sZSA9IFwicHJlc2VudGF0aW9uXCJdIHsgYmFja2dyb3VuZC1jb2xvciA6IHRyYW5zcGFyZW50ICFpbXBvcnRhbnQgO31cbiAgICAgICAgLyogI3JlZ2lvbiBIZWFkZXIsIEZvb3RlciAmIExvZ28gKi9cbiAgICAgICAgLm1vZGVybiAuQ1hIZWFkZXIsIC54bS1mb3JtLm1vZGVybiAuQ1hGb290ZXIgeyBiYWNrZ3JvdW5kLWltYWdlIDogbGluZWFyLWdyYWRpZW50KCA0NWRlZywgI0FDQ0VOVF9ETTAwIDAlLCAjQUNDRU5UX0RNMzAgNTAlLCAjQUNDRU5UX0RNMDAgMTAwJSApO31cblxuICAgICAgICBAa2V5ZnJhbWVzIGtmRmFkZUlOX0hlYWRlciB7XG4gICAgICAgICAgMCUgICAgICB7IGJveC1zaGFkb3cgOiBub25lIDt9XG4gICAgICAgICAgMTAwJSAgICB7IGJveC1zaGFkb3cgOiAwIC41dmggLjV2aCAjU0hBRE9XX0RNIDt9fVxuXG4gICAgICAgIEBrZXlmcmFtZXMga2ZGYWRlSU5fRm9vdGVyIHtcbiAgICAgICAgICAwJSAgICAgIHsgYm94LXNoYWRvdyA6IG5vbmUgO31cbiAgICAgICAgICAxMDAlICAgIHsgYm94LXNoYWRvdyA6IDAgLS41dmggLjV2aCAjU0hBRE9XX0RNIDt9fVxuICAgICAgICAvKiAjZW5kcmVnaW9uIEhlYWRlciwgRm9vdGVyICYgTG9nbyAqL1xuICAgICAgICAvKiAjcmVnaW9uIEZpZWxkc2V0ICovXG4gICAgICAgIC5tb2Rlcm4gZGl2LkNYRmllbGRTZXQ6aGFzKC5Db2RCaS4tLUhUTUxfUGFuZWwpIHsgYm9yZGVyIDogbm9uZSAhaW1wb3J0YW50IDt9XG5cbiAgICAgICAgLm1vZGVybiBkaXYuQ1hGaWVsZFNldCB7XG4gICAgICAgICAgcGFkZGluZy1ib3R0b20gICAgICA6IDJlbSA7XG4gICAgICAgICAgbWFyZ2luLWJvdHRvbSAgICAgICA6IDFlbSA7XG4gICAgICAgICAgYm9yZGVyLXN0eWxlICAgICAgICA6IHNvbGlkIDtcbiAgICAgICAgICBib3JkZXItY29sb3IgICAgICAgIDogI0FDQ0VOVDMwX0RNIDtcbiAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yICAgIDogdHJhbnNwYXJlbnQgO1xuICAgICAgICAgIGJveC1zaGFkb3cgICAgICAgICAgOiBub25lIDtcbiAgICAgICAgICBib3JkZXItcmFkaXVzICAgICAgIDogLjVlbSA7fVxuXG4gICAgICAgIC5tb2Rlcm4gLkNYRmllbGRTZXQ6aG92ZXIge1xuICAgICAgICAgIGJhY2tncm91bmQtaW1hZ2UgICAgOiBsaW5lYXItZ3JhZGllbnQoIDQ1ZGVnLCAjQUNDRU5UX0RNMDAgMCUsICNBQ0NFTlRfRE0yMCA1MCUsICNBQ0NFTlRfRE0wMCAxMDAlICk7XG4gICAgICAgICAgdHJhbnNpdGlvbiAgICAgICAgICA6IGFsbCAuNXMgZWFzZS1pbi1vdXQgO1xuICAgICAgICAgIGJvcmRlci1jb2xvciAgICAgICAgOiAjQUNDRU5UX0RNIDtcbiAgICAgICAgICBib3gtc2hhZG93ICAgICAgICAgIDogMCAwIC41ZW0gI1NIQURPV19ETSA7fVxuICAgICAgICAubW9kZXJuIC5DWEZpZWxkU2V0OmhhcyggLlhGaWVsZFNldFdyYXBwZXIgLkNvZEJpLi0tSFRNTF9QYW5lbCApOmhvdmVyIHtcbiAgICAgICAgICBiYWNrZ3JvdW5kLWltYWdlICAgIDogbm9uZSAhaW1wb3J0YW50IDtcbiAgICAgICAgICB0cmFuc2l0aW9uICAgICAgICAgIDogYWxsIC41cyBlYXNlLWluLW91dCA7XG4gICAgICAgICAgYm9yZGVyLWNvbG9yICAgICAgICA6ICNBQ0NFTlQgO1xuICAgICAgICAgIGJveC1zaGFkb3cgICAgICAgICAgOiBub25lIDt9XG4gICAgICAgIC8qICNlbmRyZWdpb24gRmllbGRzZXQgKi9cbiAgICAgICAgLyogI3JlZ2lvbiBBbmltYXRpb24gLSBJbnB1dCBVbmRlcnNjb3JlICovXG4gICAgICAgIEBrZXlmcmFtZXMga2ZUZXh0RmllbGQge1xuICAgICAgICAgIDAlIHtcbiAgICAgICAgICAgICAgYm9yZGVyLXdpZHRoICAgIDogMCA7XG4gICAgICAgICAgICAgIGJvcmRlci1jb2xvciAgICA6ICNJTlBVVF9CT1JERVJfRE0wMCAhaW1wb3J0YW50IDt9XG4gICAgICAgICAgMTAwJSB7XG4gICAgICAgICAgICAgIGJveC1zaGFkb3cgICAgICAgICAgICAgICAgICA6IDAgMCAuMmVtICNTSEFET1dfRE0gIWltcG9ydGFudCA7XG4gICAgICAgICAgICAgIGJvcmRlci1ib3R0b20tbGVmdC1yYWRpdXMgICA6IC4yZW0gO1xuICAgICAgICAgICAgICBib3JkZXItYm90dG9tLXJpZ2h0LXJhZGl1cyAgOiAuMmVtIDtcbiAgICAgICAgICAgICAgYm9yZGVyLXRvcC1sZWZ0LXJhZGl1cyAgICAgIDogMCA7XG4gICAgICAgICAgICAgIGJvcmRlci10b3AtcmlnaHQtcmFkaXVzICAgICA6IDAgO1xuICAgICAgICAgICAgICBib3JkZXItc3R5bGUgICAgICAgICAgICAgICAgOiBzb2xpZCA7XG4gICAgICAgICAgICAgIGJvcmRlci1ib3R0b20td2lkdGggICAgICAgICA6IC41ZW0gO1xuICAgICAgICAgICAgICBib3JkZXItY29sb3IgICAgICAgICAgICAgICAgOiAjSElHSExJR0hUX0RNICFpbXBvcnRhbnQgO319XG4gICAgICAgIC5YVGV4dEZpZWxkOmZvY3VzIHsgYW5pbWF0aW9uIDouNXMga2ZUZXh0RmllbGQgZm9yd2FyZHMgZWFzZS1pbi1vdXQgIWltcG9ydGFudCA7IG91dGxpbmUtY29sb3IgOiAjSElHSExJR0hUX0RNIDt9XG5cbiAgICAgICAgZmllbGRzZXQuWEZpZWxkU2V0OmhhcyhpbnB1dC5YVGV4dEZpZWxkOmZvY3VzKSBsZWdlbmQgeyB0cmFuc2l0aW9uIDogLjVzIGFsbCAhaW1wb3J0YW50IDsgY29sb3IgOiAjU0hBRE9XX0RNICFpbXBvcnRhbnQgOyB0ZXh0LXNoYWRvdyA6IDBlbSAwIC4wNWVtICNISUdITElHSFRfRE0gIWltcG9ydGFudCA7fVxuICAgICAgICAvKiAjZW5kcmVnaW9uIEFuaW1hdGlvbiAtIElucHV0IFVuZGVyc2NvcmUgKi9cbiAgICAgICAgLyogI3JlZ2lvbiBCdXR0b25zICovXG4gICAgICAgIC54bS1mb3JtLm1vZGVybiBidXR0b24geyBjb2xvciA6ICNBQ0NFTlRfRE0gOyBib3JkZXItY29sb3IgOiAjSElHSExJR0hUX0RNIDsgYmFja2dyb3VuZDogbGluZWFyLWdyYWRpZW50KDkzZGVnLHJnYmEoNSwgNSwgNSwgMSkgMCUsIHJnYmEoNTYsIDQ3LCA0NywgMSkgMjMlLCByZ2JhKDEwNywgODMsIDY1LCAxKSA1NSUsIHJnYmEoNTYsIDUyLCA1MiwgMSkgOTAlLCByZ2JhKDAsIDAsIDAsIDEpIDEwMCUpICFpbXBvcnRhbnQgO31cblxuICAgICAgICAueG0tZm9ybS5tb2Rlcm4gLlhCdXR0b25MaXN0OmhvdmVyLFxuICAgICAgICAueG0tZm9ybS5tb2Rlcm4gLlhCdXR0b246aG92ZXIge1xuICAgICAgICAgIHRyYW5zaXRpb24gICAgICAgICAgOiAuNXMgYWxsIGVhc2UtaW4tb3V0IDtcbiAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yICAgIDogbm9uZSA7XG4gICAgICAgICAgYm9yZGVyLXJhZGl1cyAgICAgICA6IC4yZW0gO1xuICAgICAgICAgIHNjYWxlICAgICAgICAgICAgICAgOiAxLjA1IDtcbiAgICAgICAgICBib3gtc2hhZG93ICAgICAgICAgIDogMCAwIC4yZW0gI0FDQ0VOVF9ETSA7fVxuICAgICAgICAvKiAjZW5kcmVnaW9uIEJ1dHRvbnMgKi9cbiAgICAgICAgLyogI3JlZ2lvbiBJbnB1dHMgKi9cbiAgICAgICAgc2VsZWN0LFxuICAgICAgICBzZWxlY3Q6Zm9jdXMgeyBiYWNrZ3JvdW5kLWNvbG9yIDogdHJhbnNwYXJlbnQgIWltcG9ydGFudCA7fVxuXG4gICAgICAgIC54bS1mb3JtLm1vZGVybiBpbnB1dC5YSXRlbS5YVGV4dEZpZWxkLFxuICAgICAgICAueG0tZm9ybS5tb2Rlcm4gdGV4dGFyZWEuWEl0ZW0uWFRleHRBcmVhICB7IGJvcmRlci1yYWRpdXMgOiAuNWVtIDsgYm94LXNoYWRvdyA6IDAgMCAuMjVlbSAjQUNDRU5UX0RNICFpbXBvcnRhbnQgOyBiYWNrZ3JvdW5kLWNvbG9yIDogdHJhbnNwYXJlbnQgIWltcG9ydGFudCA7fVxuICAgICAgICAvKiAjZW5kcmVnaW9uIElucHV0cyAqL1xuICAgICAgICAvKiAjcmVnaW9uIERvY3VtZW50ICovXG4gICAgICAgIGJvZHkubW9kZXJuLnhtLWJvZHkgeyBiYWNrZ3JvdW5kLWNvbG9yIDogYmxhY2sgO31cbiAgICAgICAgLyogI2VuZHJlZ2lvbiBEb2N1bWVudCAqL1xuICAgICAgICAvKiAjcmVnaW9uIFBhcmFncmFwaHMgZXRjLiAqL1xuICAgICAgICBwLCBoMSwgaDIsIGgzLCBoNCwgaDUsIGg2LCB1bCwgc3BhbiB7IGNvbG9yIDogI0FDQ0VOVF9ETSA7fVxuICAgICAgICAvKiAjZW5kcmVnaW9uIFBhcmFncmFwaHMgZXRjLiAqL1xuICAgICAgICAvKiAjcmVnaW9uIFByaW50ICovXG4gICAgICAgIEBtZWRpYSBwcmludCB7XG4gICAgICAgICAgLnhtLWZvcm0gLnhtLWNvbnRlbnQgZGl2LnByaW50LlhTcGFuIHsgYmFja2dyb3VuZC1jb2xvcjogI0FDQ0VOVF9ETTEwICFpbXBvcnRhbnQgO31cblxuICAgICAgICAgIGxhYmVsIHNwYW4sXG4gICAgICAgICAgbGFiZWwgc3BhbiBlbSB7IGNvbG9yOiAjQUNDRU5UX0RNNTAgO319XG4gICAgICAgIC8qICNlbmRyZWdpb24gUHJpbnQgKi9cbiAgICAgIH1cbiAgICAgIC8qICNlbmRyZWdpb24gRGFyayBNb2RlICovXG4gICAgICAvKiAjcmVnaW9uIERydWNrIEVpbnN0ZWxsdW5nZW4qL1xuICAgICAgLnhtLWZvcm0ubW9kZXJuIERJVi5YRmllbGRTZXRXcmFwcGVyLFxuICAgICAgLnhtLWZvcm0ubW9kZXJuIERJVi5YSXRlbS5YQ29udGFpbmVyLFxuICAgICAgQ1hGaWVsZFNldCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgYm9yZGVyOm5vbmUgIWltcG9ydGFudDt9XG5cbiAgICAgIC5wcmludC5YU3BhbiB7IGZvbnQtc2l6ZTogMmVtICFpbXBvcnRhbnQ7IGxpbmUtaGVpZ2h0OiAxZW0gIWltcG9ydGFudCA7IHRleHQtanVzdGlmeTogYXV0bzt9XG5cbiAgICAgIEBtZWRpYSBwcmludCB7XG4gICAgICAgICAgaDEgeyBmb250LXNpemU6M2VtICFpbXBvcnRhbnQ7fVxuICAgICAgICAgIGgyIHsgZm9udC1zaXplOiAyLjVlbSAhaW1wb3J0YW50O31cblxuICAgICAgICAgIC5DWFRleHRGaWVsZCB7IG1hcmdpbi1ib3R0b206IDEuNWVtICFpbXBvcnRhbnQgO31cblxuICAgICAgICAgIC54bS1mb3JtIC54bS1jb250ZW50IGRpdi5wcmludC5YU3BhbiB7IGJhY2tncm91bmQtY29sb3I6ICM2NWIyMmUxMCAhaW1wb3J0YW50IDt9XG5cbiAgICAgICAgICBsYWJlbCxcbiAgICAgICAgICBsYWJlbCBzcGFuLFxuICAgICAgICAgIGxhYmVsIHNwYW4gZW0geyBmb250LXNpemU6MS4yNWVtICFpbXBvcnRhbnQ7IGNvbG9yOiAjNjViMjJlIDt9XG5cbiAgICAgICAgICAuQ1hVcGxvYWQgKjpub3QobGFiZWwpIHsgZm9udC1zaXplOiAxLjI1ZW0gIWltcG9ydGFudCA7IG1hcmdpbi10b3AgOiAuNWVtIDt9fVxuICAgICAgLyogI3JlZ2lvbiBQYWdlQnJlYWsgSGFuZGxpbmcgKi9cbiAgICAgIC54bS1mb3JtLm1vZGVybiAuZG9udF9icmVhayB7IHBhZ2UtYnJlYWstaW5zaWRlOiBhdm9pZCA7fVxuXG4gICAgICAuQ1hQYWdlOmZpcnN0LWNoaWxkLCAuQ1hQYWdlOm5vdCg6Zmlyc3QtY2hpbGQpIHsgcGFnZS1icmVhay1iZWZvcmU6IGF2b2lkIDtcblxuICAgICAgLkNYVGV4dEZpZWxkLCAuQ1hDaGVja2JveCwgLkNYU2VsZWN0LCAuQ1hUZXh0QXJlYSwgLkNYQXBwb2ludG1lbnQsIC5DWFNpZ25hdHVyZSwgLkNYVXBsb2FkLCAuQ1hDYXB0Y2hhLCAuQ1hNYXAgeyBicmVhay1pbnNpZGU6IGF2b2lkIDt9XG5cbiAgICAgIC5DWFNlbGVjdCAuWERyb3BEb3duLCAuQ1hUZXh0RmllbGQgLlhUZXh0RmllbGQsIC5DWFRleHRBcmVhIC5YVGV4dEFyZWEsIC5DWFNpZ25hdHVyZSAuWFNpZ25hdHVyZSB7IHBhZ2UtYnJlYWstaW5zaWRlOiBhdm9pZCA7fVxuICAgICAgXG4gICAgICAuQ1hDaGVja2JveCB7IG1hcmdpbi1sZWZ0OiAwICFpbXBvcnRhbnQgOyBwYWdlLWJyZWFrLWluc2lkZTogYXZvaWQgO31cbiAgICAgIC8qICNlbmRyZWdpb24gUGFnZUJyZWFrIEhhbmRsaW5nICovXG4gICAgICAvKiAjZW5kcmVnaW9uIERydWNrIEVpbnN0ZWxsdW5nZW4qL1xuXG59YFxuICAgICAgLnJlcGxhY2UoL1xcey9nLCBcIjxcIilcbiAgICAgIC5yZXBsYWNlKC9cXH0vZywgXCI+XCIpXG4gICAgICAucmVwbGFjZSgvXFwsL2csIFwiXHUwMEE3XCIpLFxuICB9KTtcbn1cblxubG9hZENvbmZpZygpO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQVNPLFNBQVMsYUFBbUI7QUFDakMsUUFBTSxTQUFTLFNBQVMsY0FBYyxrQ0FBa0M7QUFDeEUsUUFBTSxpQkFBaUIsU0FBUyxjQUFjLDBDQUEwQztBQUV4RixTQUFPLE1BQU0sV0FBVztBQUFBLElBQ3RCLFNBQVM7QUFBQSxJQUNULE1BQU07QUFBQSxJQUNOLGFBQWE7QUFBQSxJQUNiLGNBQWMsU0FDVixPQUFPLGFBQWEsT0FBTyxJQUMzQjtBQUFBLElBQ0osVUFBVSxpQkFDTixlQUFlLGFBQWEsT0FBTyxJQUNuQztBQUFBLElBQ0osS0FBSztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsR0FpUkYsUUFBUSxPQUFPLEdBQUcsRUFDbEIsUUFBUSxPQUFPLEdBQUcsRUFDbEIsUUFBUSxPQUFPLE1BQUc7QUFBQSxFQUN2QixDQUFDO0FBQ0g7QUFFQSxXQUFXOyIsCiAgIm5hbWVzIjogW10KfQo=
