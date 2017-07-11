/*! flypanels - v2.1.0 - 2017-07-11
* https://github.com/SubZane/flyPanels
* Copyright (c) 2017 Andreas Norman; Licensed MIT */
!function(a,b){"function"==typeof define&&define.amd?define([],b(a)):"object"==typeof exports?module.exports=b(a):a.fpm_treemenu=b(a)}("undefined"!=typeof global?global:this.window||this.global,function(a){"use strict";var b,c,d,e={},f=!!document.querySelector&&!!a.addEventListener,g={expandHandler:"a.expand",onInit:function(){},onDestroy:function(){},OnExpandOpen:function(){},OnExpandClose:function(){}},h=function(){return navigator.userAgent.toLowerCase().indexOf("android")>-1?!0:!1},i=function(){return navigator.userAgent.match(/iPhone/i)||navigator.userAgent.match(/iPad/i)||navigator.userAgent.match(/iPod/i)?!0:!1},j=function(a){"false"===a.getAttribute("aria-expanded")?(a.setAttribute("aria-expanded","true"),a.querySelector("ul").setAttribute("aria-hidden","false"),a.querySelector("ul").removeAttribute("hidden"),setTimeout(function(){a.classList.toggle("expanded")},b.transitiontime),k("OnExpandOpen")):(a.setAttribute("aria-expanded","false"),a.querySelector("ul").setAttribute("aria-hidden","true"),a.querySelector("ul").setAttribute("hidden",""),setTimeout(function(){a.classList.toggle("expanded")},b.transitiontime),k("OnExpandClose"))},k=function(a){void 0!==b[a]&&b[a].call(d)},l=function(a,b){var c={};return m(a,function(b,d){c[d]=a[d]}),m(b,function(a,d){c[d]=b[d]}),c},m=function(a,b,c){if("[object Object]"===Object.prototype.toString.call(a))for(var d in a)Object.prototype.hasOwnProperty.call(a,d)&&b.call(c,a[d],d,a);else for(var e=0,f=a.length;f>e;e++)b.call(c,a[e],e,a)};return e.destroy=function(){b&&(document.documentElement.classList.remove(b.initClass),document.removeEventListener("click",eventHandler,!1),b=null,c=null,k("onDestroy"))},e.init=function(a){if(f){e.destroy(),b=l(g,a||{}),d=document.querySelector(b.container),(h()||i())&&document.querySelector(".flypanels-treemenu").classList.add("touch");var c=document.querySelectorAll(".flypanels-treemenu li.haschildren "+b.expandHandler);m(c,function(a,b){a.addEventListener("click",function(a){j(this.parentElement.parentElement),a.preventDefault()})}),k("onInit")}},e});