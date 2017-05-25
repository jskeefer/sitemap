/////////////////////////////////////////////////////////////////
//name: sitemap.js
//location: /sitemap.js
//description: common functions for app internal functions
/////////////////////////////////////////////////////////////////

var sitemap = {	
	//setup app global variables
	config: '',
	breadCrumbs: [],
	userLoggedIn: false,
	routes: '',
	//init function
	init: function(){
		sitemap.loadJSON('/sitemap-config.json',function(sitemapConfigJson){
			sitemap.config = sitemapConfigJson;
			sitemap.loadJSON('/sitemap.json',function(sitemapJson){
				sitemap.routes = sitemapJson;
				sitemap.pagejs();
			});
		});	
	},
	pagejs: function(){
		//setup initial routes page on page reload or refresh
		//part of page.js routing plugin, found in assets
		page('/',function(){page.redirect('/home')});
		page('/home',sitemap.loadRoute);
		page('*',sitemap.loadRoute);
		page();			
	},
	//load custom element json file and load it to the class
	loadJSON: function(path,callback){
		$.getJSON(path, function(results){
			callback(results);
		});			
	},
	loadRoute: function(ctx, next){
		//setup breadcrumbs as incoming route, get path from route object, split it and slice the blank root domain route
		sitemap.breadCrumbs = ctx.path.split('/').slice(1);
		//setup default variables to load	
		var pages = sitemap.routes;
		console.log(sitemap.breadCrumbs);
		var loadPage;
		//loop through each path to get the view
		$.each(sitemap.breadCrumbs, function(i,cr) {			
			//loop through pages
			$.each(pages,function(i,mr){
				if(cr==i || i=="*"){
					loadPage = mr;
					pages = pages[i].subviews;
					return false;					
				}
				else{
					loadPage = '404';
				}
			});
		});
		//send results to page auth functon to see if it is restricted		
		if(!sitemap.checkLayoutLoaded(loadPage)){
			//load layout template
			sitemap.loadTemplate('init-layout',loadPage.layoutid,sitemap.config.templatesLayouts,null,function(){
				sitemap.loadTemplate('init-page',loadPage.templateid,sitemap.config.templatesPages,null,function(){});
			});				
		}else{
			sitemap.loadTemplate('init-page',loadPage.templateid,sitemap.config.templatesPages,null,function(){});
		}			
	},
	checkLayoutLoaded: function(loadPage){
		//set current layout as active in data tag and load if necessary
		var data_layoutid = $('#init-layout').attr('data-layoutid');
		//load page layout if needed
		if(loadPage.layoutid !== data_layoutid){
			$('#init-layout').attr('data-layoutid',loadPage.layoutid);
			return false;
		}else{
			return true;
		}		
	},
	loadTemplate: function(sectionid,templateid,templateurl,templatejson=null,callback=null){
		templateurl = templateurl + templateid + '.html';
		//check to see if template is all ready imported
		sitemap.attachImport(templateid,templateurl,function(){
			sitemap.attachTemplate(templateid,sectionid,templatejson,function(){
				sitemap.processTemplate();
			});
		});
		if(callback!==null){
			callback();
		}		
	},
	attachImport: function(templateid,templateurl,callback){
		if($('#import-'+templateid).length){
			callback();
		}else{
			var link = document.createElement('link');
			link.rel = 'import';
			link.href = templateurl;
			link.id = 'import-'+templateid;
			link.onload = function(e){
				callback();
			};
			document.head.appendChild(link);		
		}		
	},
	//attach imported template to the dom
	// if you use try to use jquery to import the node it will run any javascript in the template twice
	// might be a bug, but dont waste time and use HTML5 querySelector and appendChild
	attachTemplate: function(template,sectionid,templatejson,callback){
		//get the template tag from the imported document
		var c,nclone,content,clone,re;
		c = document.getElementById('import-'+template).import;
		//empty out any old template in section
		$('#'+sectionid).empty();
		//process any json with template
		if(templatejson!==null){
			nclone = $(c).find('#'+template).html();
			$.each(templatejson,function(i,v){
				re = new RegExp("{{"+i+"}}", "g");
				console.log(v);
				nclone = nclone.replace(re,v);
			});
			$('#'+sectionid).html(nclone);
		}
		else{
			content = c.querySelector('template').content;
			//append template content into section
			clone = document.importNode(content, true);
			document.querySelector('#'+sectionid).appendChild(clone);
		}
		callback();
	},
	//attach data template to the dom
	pageTemplate: function(sectionid,templateid,pagejson,callback=null){
		var content = $(templateid).html();
		if(pagejson!==null){
			$.each(pagejson,function(i,v){
				var re = new RegExp("{{"+i+"}}", "g");
				content = content.replace(re,v);
			});
		}
		$(sectionid).append(content);
		if(callback!==null){
			callback();
		}
		return;
	},
	//after template has been attached run
	processTemplate: function(){	
		//go through all of the pages
		//check if theme has an afterAttachTemplate function invoked
		if (typeof afterAttachTemplate == 'function') { 
			afterAttachTemplate();
		}
	}	
}
