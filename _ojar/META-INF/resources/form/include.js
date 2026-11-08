<%@page language="java" contentType="application/javascript; charset=UTF-8" pageEncoding="UTF-8"%>

<%@page import="org.slf4j.Logger"%>
<%@page import="org.slf4j.LoggerFactory"%>
<%@page import="java.util.Enumeration"%>

<%@page import="com.alibaba.fastjson.serializer.SerializerFeature"%>
<%@page import="com.alibaba.fastjson.JSONObject"%>
<%@page import="com.alibaba.fastjson.JSON"%>

<%@page import="de.xima.fc.CmnConst"%>
<%@page import="de.xima.cmn.utils.XStringUtils"%>
<%@page import="de.xima.cmn.utils.XPathUtils"%>
<%@page import="de.xima.cmn.web.utils.XServletUtils"%>

<%@page import="de.xima.fc.mdl.enums.EFormRequestType"%>

<%! static Logger LOG = LoggerFactory.getLogger("include.js"); %>

<%
XServletUtils.setEncodings(request, response, CmnConst.DFLT_ENCODING);
XServletUtils.setNoCacheHeaders(response);
response.setContentType("application/javascript");
%>

<%!
public String escapeJSON(String json){
	String escaped = JSON.toJSONString(json, SerializerFeature.BrowserCompatible);
	LOG.trace("Escape '" + json + "' to '" + escaped + "'");
	return escaped;
}

public String escapeJSON(JSONObject json){
	String escaped = JSON.toJSONString(json, SerializerFeature.BrowserCompatible);
	LOG.trace("Escape '" + json + "' to '" + escaped + "'");
	return escaped;
}

public String getProvideUrl(HttpServletRequest request, HttpServletResponse response){
	String finalURL = XPathUtils.joinPath('/', "<xfc-base-url>" , CmnConst.FORM_SERVLETS_SUBDIR, EFormRequestType.PROVIDE, "<xfc-form-id>");
	finalURL = escapeJSON(finalURL);
	LOG.debug("getProvideUrl: " + finalURL);
	
	return finalURL;
}

public String getBaseUrl(HttpServletRequest request){
	String url = request.getParameter("form_base");
	url = (XStringUtils.isNotBlank(url)) ? url : getURLWithContextPath(request);
	url = escapeJSON(url);
	LOG.debug("getBaseUrl: " + url);
	
	return url;
}

public String getLoginFallback(HttpServletRequest request){
	String isLoginFallback = request.getParameter("xfc-rp-login-fallback");
	isLoginFallback = (XStringUtils.isNotBlank(isLoginFallback)) ? isLoginFallback : "false";
	isLoginFallback = escapeJSON(isLoginFallback);
	LOG.debug("getLoginFallback: " + isLoginFallback);
	
	return isLoginFallback;
}

public static String getURLWithContextPath(HttpServletRequest request) {
	return request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort() + request.getContextPath();
}

public String getParamJson(HttpServletRequest request){
	JSONObject jo = new JSONObject();

	Enumeration<String> en = request.getParameterNames();

	while (en.hasMoreElements()) {
		String parameterName = en.nextElement();
		String parameterValue = request.getParameter(parameterName);
		jo.put(parameterName,parameterValue);
	}
	String json = escapeJSON(jo);
	LOG.debug("getParamJson: " + json);
	
	return json;
}
%>

window.xima = window.xima || {};
window.xima.fc = window.xima.fc || {};
window.xima.fc.form = window.xima.fc.form || {};
window.xima.fc.form.loadData = window.xima.fc.form.loadData|| {};
window.xima.fc.form.load = window.xima.fc.form.load || function(options, trigger){
(function($, options, trigger){

  var params = {};
  $.each((window.location.search||"").substring(1).split("&"), function(_, query) {
    var keyValuePair = query.split("=");
    params[keyValuePair[0]] = decodeURIComponent(keyValuePair[1]);
  });
  
	var frid = params.frid;

	var options = options || {};
	var o = $.extend({
		loadingImageURL   : window.xima.fc.form.loadingImageURL || "data:image/png;base64,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",
		loadingImageStyle : window.xima.fc.form.loadingImageStyle || ".xm-form-loader-icon { text-align:center; -webkit-animation: spin 0.5s ease-in-out infinite; -moz-animation: spin 0.5s ease-in-out infinite; animation: spin 0.5s ease-in-out infinite;} @-moz-keyframes spin { 100% { -moz-transform: rotateY(360deg); } }@-webkit-keyframes spin { 100% { -webkit-transform: rotateY(360deg); } }@keyframes spin { 100% { -webkit-transform: rotateY(360deg); transform:rotateY(360deg); } }"
	},options);

	if(o.form_container_id && o.form_container_id != 'null') {
		var previousData = window.xima.fc.form.loadData[o.form_container_id];
		if(previousData) {
			if(previousData.data && previousData.data.frid) {
				delete previousData.data.frid;
			}
			o = $.extend(true, o, previousData);
		}
	}

	var d = $.extend({
		"xfc-rp-inline":true,
		"xfc-rp-form-only":true,
		"xfc-pp-external":true,
		"xfc-rp-login-fallback": '<%=getLoginFallback(request)%>',
		"xfc-rp-usejq":false,
		"xfc-rp-keepalive":true,
		"xfc-rp-usecss":true,
		"xfc-rp-useui":true,
		"xfc-rp-form-container-id": o.form_container_id,
		"fcpuid":window.xima.fc.form.fcpuid,
		"frid": frid
	}, <%=getParamJson(request)%>, o.data);
	
	if (params["xfc-pp-use-base-url"] === "true") {
	  d["xfc-pp-use-base-url"] = true;
	}

	// $.fn.html also executes scripts, but in arbitrary order
	// This function extracts all script elements from the given html, inserts the
	// html without the scripts into the given container, then executes all scripts
	// in the order they were found in the html
	// For performance, first downloads all scripts in parallel, then executes them
	function insertHtml(container, html) {
		var parsedHtml = $($.parseHTML(html, undefined, true));
		var scripts = parsedHtml.find("script").remove().toArray();
		var htmlWithoutScripts = parsedHtml.toArray().map(function(node){return node.outerHTML}).join("");
		container.html(htmlWithoutScripts);
		var deferred = $.Deferred();
		deferred.resolve();
		$.each(scripts, function(_, script) {
			if (script.textContent) {
				deferred = deferred.then(() => {
					try {
						$.globalEval(script.textContent);
					} catch (ignore) {} // engine should already log execution errors
				});
			}
			else if (script.src) {
				deferred = deferred.then(() => {
					var newScriptDeferred = $.Deferred();
					var newScript = document.createElement("script");
					newScript.src = script.src;
					// Remove old scripts, if any.
					if (script.id || script.name || script.dataset.name) {
						var oldScript = script.id
							? document.getElementById(script.id)
							: script.name
							? document.getElementsByName(script.name)[0]
						    : document.querySelector("script[data-name='" + $.escapeSelector(script.dataset.name) + "']");
						if (oldScript) {
							oldScript.parentElement.removeChild(oldScript);
						}
					}
					if (script.id) {
						newScript.id = script.id;
					}
					if (script.name) {
						newScript.name = script.name;
					}
					if (script.dataset.name) {
						newScript.dataset.name = script.dataset.name;
					}
					newScript.addEventListener("load", function() {
						newScriptDeferred.resolve();
					});
					newScript.addEventListener("error", function(e) {
						newScriptDeferred.resolve();
					});
					document.head.appendChild(newScript);
					return newScriptDeferred;
				});
			}
		});
	}

	function success(html){
		insertHtml(o.form_container, html);
	}

	function error(data){
		insertHtml(o.form_container, data.responseText);
	}

	function buildLoader(){
		o.form_container.html('');

		var l = $('<div>').addClass('xm-form-loader-icon').appendTo(o.form_container);
		$('<style>').text(o.loadingImageStyle).appendTo(l);
		$('<img>').attr('src',o.loadingImageURL).appendTo(l);
	}

	function render(){

		var provideUrl = o.provide_url;
		if(!o.form_base || o.form_base == 'null') {
			console.error('Invalid form base: ' + o.form_base);
			return;
		}
		if(!o.form_id || o.form_id == 'null') {
			console.error('Invalid form id: ' + o.form_id);
			return;
		}

		var formBase = o.form_base;
		if (typeof formBase === 'string' && formBase[formBase.length - 1] === '/') {
			formBase = formBase.slice(0, -1);
		}
		provideUrl = provideUrl.replace("<xfc-base-url>", formBase);
		provideUrl = provideUrl.replace("<xfc-form-id>", o.form_id);

		var isAsync = true;
		var asyncBool = <%=escapeJSON(request.getParameter("async"))%>;

		if(asyncBool != undefined || asyncBool != null){
			isAsync = (asyncBool === 'true');
		}

		$.ajax($.extend({
			type:    "GET",
			url:     provideUrl,
			data:    d,
			cache:   false,
			async:   isAsync,
			xhrFields: { withCredentials: true },
			beforeSend:buildLoader,
			success: success,
			crossDomain: true
		}, options.ajax )).fail(error);
	}

	$(function(){
		o.form_container_id = (o.form_container_id) ? o.form_container_id : <%=escapeJSON(request.getParameter("form_container_id"))%>;
		o.form_container = (o.form_container_id) ? $('#'+o.form_container_id) :  o.form_container;
		o.form_container = (o.form_container) ? o.form_container : $('.tx-xm-formcycle, .xfc-template-body').first();
		if(o.form_container_id && o.form_container_id != 'null') {
			window.xima.fc.form.loadData[o.form_container_id] = o;
		}
		o.form_base = (o.form_base) ? o.form_base : <%=getBaseUrl(request)%>;
		o.form_id = (o.form_id) ? o.form_id : <%=escapeJSON(request.getParameter("form_id"))%>;
		o.provide_url = <%=getProvideUrl(request, response)%>;

		if (o.data && o.data.hasOwnProperty("xfc-pp-base-url")){
			o.form_base = o.data["xfc-pp-base-url"];
		}

		render();
	});

})(jQuery, options, trigger)}

jQuery(function(){
	if ('<%=request.getParameter("auto")%>' == '1'){
	  window.xima.fc.form.load();
	}
});

