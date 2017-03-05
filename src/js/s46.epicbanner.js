"use strict";
(function($){

	$.fn.s46EpicBanner = function(settings) {

		return this.each( function(){

			var self 			= $(this),
				slides 			= self.find("> ul > li"),
				slogans 		= slides.find("> .eb-slogan"),
				navi_cont		= $("<div class='eb-navi-cont'/>"),
				navi_next 		= $("<div class='eb-next'/>"),
				navi_prev 		= $("<div class='eb-prev'/>"),
				navi_pbar 		= $("<div class='eb-pbar'/>"),
				navi_pagi		= $("<div class='eb-pagi'/>"),
				pagi_el 		= [],

				// SETTINGS
				sett 			= typeof settings 					!= 'undefined' ? settings : {},
				curr 			= typeof sett.current_slide 		!= 'undefined' ? parseInt(sett.current_slide) : 0,
				delay 			= typeof sett.delay 				!= 'undefined' ? sett.delay 			: 5000,
				touchable 		= typeof sett.touchable 			!= 'undefined' ? sett.touchable 		: true,
				show_navi 		= typeof sett.show_navigation		!= 'undefined' ? sett.show_navigation 	: true,
				show_pagi 		= typeof sett.show_pagination		!= 'undefined' ? sett.pagination 		: true,
				show_pbar 		= typeof sett.show_progressbar		!= 'undefined' ? sett.show_progressbar 	: false,
				auto_height		= typeof sett.auto_height			!= 'undefined' ? sett.auto_height 		: true,
				min_height		= typeof sett.min_height			!= 'undefined' ? sett.min_height 		: null,
				max_height		= typeof sett.max_height			!= 'undefined' ? sett.max_height 		: null,
				style 			= typeof sett.style					!= 'undefined' ? sett.style 			: "",
				ratio 			= typeof sett.ratio					!= 'undefined' ? sett.ratio 			: 0,

				video_autoplay	= typeof sett.video_autoplay		!= 'undefined' ? sett.video_autoplay 	: true,
				video_loop		= typeof sett.video_loop			!= 'undefined' ? sett.video_loop 		: true,
				video_muted		= typeof sett.video_muted			!= 'undefined' ? sett.video_muted 		: true,
				video_preload	= typeof sett.video_preload			!= 'undefined' ? sett.video_preload 	: "none",
				video_controls	= typeof sett.video_controls		!= 'undefined' ? sett.video_controls 	: false,

				check_slides = function(int) {
					if (int > slides.length - 1) return 0;
					if (int < 0) return slides.length - 1;
					return int;
				},
				
				parseBool = function(str) {
					if (typeof str == 'undefined') return false;
					if (str.length == null) {
						return str == 1 ? true : false;
					} else {
						return str == "true" ? true : false;
				 	}
				},

				mouse 		= { x: 0, y: 0 },											// MOUSE INFO
				touch		= { swipe: false, start: 0, dist: 0, untouch: false },		// TOUCH INFO
				interval 	= 0,														// TIMER INTERVAL
				stop_timer	= false,													// ANIMATION STOP
				animating	= false,													// ANIMATION EVENT FLAG

				offsetW 	= self.width(),												// BANNER OFFSET WIDTH

				has_touch 	= 'ontouchstart' in window,												// IS DEVICE SUPPORTS TOUCHING
				resizeEvent = 'onorientationchange' in window ? 'orientationchange' : 'resize';		// RESIZE EVENT FOR DEVICES


			// READ SETTINGS FROM DOM
			if ('undefined' != typeof self.data("current-slide")) 			curr 		= parseInt(self.data("current-slide"));
			if ('undefined' != typeof self.data("delay")) 					delay 		= parseInt(self.data("delay"));
			if ('undefined' != typeof self.data("touchable")) 				touchable 	= self.data("touchable");
			if ('undefined' != typeof self.data("show-navigation")) 		show_navi 	= self.data("show-navigation");
			if ('undefined' != typeof self.data("show-pagination")) 		show_pagi 	= self.data("show-pagination");
			if ('undefined' != typeof self.data("show-progressbar")) 		show_pbar 	= self.data("show-progressbar");
			if ('undefined' != typeof self.data("min-height")) 				min_height	= self.data("min-height");
			if ('undefined' != typeof self.data("max-height")) 				max_height	= self.data("max-height");
			if ('undefined' != typeof self.data("auto-height")) 			auto_height	= self.data("auto-height");
			if ('undefined' != typeof self.data("style")) 					style 		= self.data("style");

			// DATA VERIFICATION
			curr = check_slides(curr);
			if (isNaN(curr)) 		curr 		= 0;
			if (isNaN(delay)) 		delay 		= 5000;

			touchable = parseBool(touchable);
			show_navi = parseBool(show_navi);
			show_pagi = parseBool(show_pagi);
			show_pbar = parseBool(show_pbar);

			if (slides.length < 2) { show_navi = false; show_pagi = false }
			if (show_pbar) navi_cont.append(navi_pbar);
			if (show_pagi) navi_cont.append(navi_pagi);
			if (show_navi) { navi_cont.append(navi_next); navi_cont.append(navi_prev); }
			if (show_pbar || show_pagi || show_navi) self.append(navi_cont);

			// PUBLIC FUNCTIONS
			self.next = function() { next_slide() };	
			self.previous = function() { prev_slide() };

			// FUNCTIONS
			var init_slides = function() {
					for (var i = 0;i < slides.length; i++) {
						$(slides.get(i)).css({ left: ((offsetW * i) - (curr * offsetW)) + "px" })
					}

					var h = Math.floor( $(slides.get(0)).height() );

					if (h == 0) h = self.width() /  ratio;
					if (max_height != null && h > parseInt(max_height)) h = max_height;
					if (min_height != null && h < parseInt(min_height)) h = min_height;

					self.css({ height: h }).addClass("eb-loaded");

					// DETECT VIDEO ELEMENT AND PLAY IT
					// var vid = self.find("> ul > li:first video").get(0).play();
				},

				update_video = function(prev_id, id) {
					var curr_vid = $(slides.get(id)).find("> video"),
						prev_vid = $(slides.get(prev_id)).find("> video");

					if (prev_vid.length) prev_vid.get(0).pause();
					if (curr_vid.length) curr_vid.get(0).play();

					
				},
				
				next_slide = function(timer_call) {
					interval = 0;

					if (slides.length == 1) return;

					update_video(curr, check_slides(curr + 1));


					if (style == "carousel") {

						$(slides.get(curr)).animate({ left: -offsetW + "px" });
						curr = check_slides(++curr);
						adjust_height();

						$(slides.get(curr)).css({ left: offsetW + "px" });
						$(slides.get(curr)).animate({ left: "0px" });


					} else if (style == "cards") {

						if (curr == slides.length - 1) {

							if (!timer_call) {
								$(slides.get(curr)).addClass("active").animate({ left: "-20px"}, 100, function() {
									$(slides.get(curr)).animate({ left: "0px"}, 200);
								});
								return;
								
							} else {
								show_slide(0);
								return;
							}
						}

						slides.css({ left: -offsetW + "px" });
						$(slides.get(curr)).css({ left: "0px" });

						curr = check_slides(++curr);
						adjust_height();

						slides.removeClass("active");
						$(slides.get(curr)).css({ left: offsetW + "px" })
							.addClass("active")
							.animate({ left: "0px" });

					} else {

						curr = check_slides(++curr);
						adjust_height();
					
						for (var i = 0; i < slides.length; i++) {
							$(slides.get(i)).animate({ left: ((i - curr) * offsetW) +  "px" });
						}

					} //-- end if

					animate_slogan();
					update_pagination();
				},

				prev_slide = function() {
					interval = 0;

					if (slides.length == 1) return;

					update_video(curr, check_slides(curr - 1));
					
					if (style == "carousel") {

						$(slides.get(curr)).animate({ left: offsetW + "px" });
						curr = check_slides(--curr);
						adjust_height();

						$(slides.get(curr)).css({ left: -offsetW + "px" });
						$(slides.get(curr)).animate({ left: "0px" });


					} else if (style == "cards") {

						if (curr == 0) {
							$(slides.get(curr)).addClass("active").animate({ left: "20px"}, 100, function() {
								$(slides.get(curr)).animate({ left: "0px"}, 200);
							});
							return;
						}

						slides.css({ left: offsetW + "px" });
						$(slides.get(curr)).css({ left: "0px" });

						curr = check_slides(--curr);
						adjust_height();

						slides.removeClass("active");
						$(slides.get(curr)).css({ left: -offsetW + "px" })
							.addClass("active")
							.animate({ left: "0px" });

					} else {

						curr = check_slides(--curr);
						adjust_height();
					
						for (var i = 0; i < slides.length; i++) {
							$(slides.get(i)).animate({ left: ((i - curr) * offsetW) + "px" });
						}

					} //-- end if

					animate_slogan();
					update_pagination();
				},

				show_slide = function(id) {
					if (id == curr) return;
					update_video(id, curr);
					interval = 0;

					if (style == "carousel" || style == "") {

						for (var i = 0; i < slides.length; i++) {
							$(slides.get(i)).css({ left: ((i - curr) * offsetW) + "px" })
											.animate({ left: ((i - id) * offsetW) + "px" });
						}

					} else if (style == "cards") {

						slides.css({ left: offsetW + "px" });
						$(slides.get(curr)).css({ left: "0px" });

						slides.removeClass("active");

						if (id > curr) {
							$(slides.get(id)).css({ left: offsetW + "px" });
						} else {
							$(slides.get(id)).css({ left: -offsetW + "px" });
						}

						$(slides.get(id)).addClass("active").animate({ left: "0px" });

					} //-- end if


					curr = id;
					adjust_height();

					animate_slogan();
					update_pagination();
				},

				adjust_height = function() {
					if (!auto_height) return;

					var h = Math.floor( $(slides.get(curr)).height() );

					if (max_height != null && h > parseInt(max_height)) h = max_height;
					if (min_height != null && h < parseInt(min_height)) h = min_height;

					self.animate({ height: h });
				},

				init_pagination = function() {

					if (show_pagi === false || show_pagi === "false" || slides.length === 0) return;

					for (var i = 0; i < slides.length; i++) {

						var node = $("<span />");
						
						(function(j){
							node.mousedown(function(){ show_slide(j); return false });
							node.on("touchstart", function(e){ show_slide(j); return false });
						})(i);	

						pagi_el[i] = node;

					}

					navi_pagi.append(pagi_el);

				},

				update_pagination = function() {
					var nodes = navi_pagi.find("span");

					nodes.removeClass("selected");
					$(nodes.get(curr)).addClass("selected");
				},

				animate_slogan = function() {

					var slogan 	=  $(slides.get(curr)).find(".eb-slogan"),
						data 	= slogan.attr("data-animate");

					if ( typeof data == "undefined" ) return;

					if (data.indexOf("opacity") != -1) slogan.css({ opacity: 0 }).animate({ opacity: 1 }, 800);

				},

				banner_mousedown = function(e) {
					try {
						var evt = has_touch ? (e.originalEvent.touches[0] || e.touches[0]) : e;
					}
					catch(e) {}

					if (true == animating) return;
					if (true == touch.swipe) touch.swipe = false;
					if (false == parseBool($(slides.get(curr)).attr("data-disable-swipe"))) {
						mouse_pos(evt);
						touch.swipe = stop_timer = true;
						touch.start = mouse.x;
						touch.dist = 0;
					}

				},

				banner_mousemove = function(e) {
					try {
						var evt = has_touch ? (e.originalEvent.touches[0] || e.touches[0]) : e;
					}
					catch(e) {}

				
					mouse_pos(evt);
					touch.dist = mouse.x - touch.start;

					if (!touch.swipe || touch.dist == 0) return;


					var id, action;
					if (touch.dist < 0) {
						action = 1;
						id = check_slides(curr + 1);
					} else {
						action = -1;
						id = check_slides(curr - 1);
					}

					if (style == "carousel" || style == "") {
					
						if (style == "") {
							if ((curr == slides.length - 1 && action == 1) || (curr == 0 && action == -1)) {

								var offset = (50 * touch.dist) / offsetW;

								$(slides.get(curr)).css({ left: offset + "px" });
								touch.untouch = true;
								return;
							}
						}

						if (action == 1) {
							$(slides.get(curr)).css({ left: (touch.dist) + "px" });
							$(slides.get(id)).css({ left: (offsetW + touch.dist) + "px" });
						} else {
							$(slides.get(curr)).css({ left: (touch.dist) + "px" });
							$(slides.get(id)).css({ left: (-offsetW + touch.dist) + "px" });
						}

					} else if (style == "cards") {

						if ((curr == slides.length - 1 && action == 1) || (curr == 0 && action == -1)) {

							var offset = (50 * touch.dist) / offsetW;

							$(slides.get(curr)).css({ left: offset + "px" });
							touch.untouch = true;
							return;
						}

						slides.removeClass("active");
						slides.css({ left: -offsetW + "px" });
						$(slides.get(curr)).css({ left: "0px" });

						if (action == 1) {
							$(slides.get(id)).css({ left: offsetW + "px" }).addClass("active").css({ left: (offsetW + touch.dist) + "px" });
						} else {
							$(slides.get(id)).css({ left: -offsetW + "px" }).addClass("active").css({ left: (-offsetW + touch.dist) + "px" });
						}

					}

				},

				banner_mouseup = function(e) {
					e.stopPropagation();

					if (touch.dist == 0) self.toggleClass("show_navi");
					if (!touch.swipe || touch.dist == 0) { touch.swipe = false; return; }

					if (touch.untouch) {
						animating = true;
						$(slides.get(curr)).animate({ left: "0px"}, 100, function() { animating = false } );
						touch.untouch = touch.swipe = false;
						return;
					}
					
					var id, action;
					if (touch.dist < 0) {
						action = 1;
						id = check_slides(curr + 1);
					} else {
						action = -1;
						id = check_slides(curr - 1);
					}
					

					if (style == "carousel" || style == "") {

						if (action == 1) {
							animating = true;
							$(slides.get(curr)).animate({ left: -offsetW + "px" }, 400, function() { animating = false });
							$(slides.get(id)).animate({ left: "0px" }, 400, function() { animating = false });
						} else {
							animating = true;
							$(slides.get(curr)).animate({ left: offsetW + "px" }, 400, function() { animating = false });
							$(slides.get(id)).animate({ left: "0px" }, 400, function() { animating = false });
						}

					} else if (style == "cards") {

						animating = true;
						$(slides.get(id)).animate({ left: "0px" }, 400, function() { animating = false });

					}

					
					update_video(curr, id);
					curr = id;

					update_pagination();

					touch.swipe = stop_timer = false;
					interval = 0;
				},

				banner_mousewheel = function(e) {

				},

				banner_keydown = function(e) {

					if (e.which == 37) prev_slide();
					if (e.which == 39) next_slide();

					if (e.which > 48 && e.which < 58) {
						if ((e.which - 49) <= (slides.length - 1)) show_slide(e.which - 49);
					}

				},

				timer_tick = function() {
					if (stop_timer) return;

					interval += 10;
					if (interval > delay) next_slide(true);
					if (show_pbar) navi_pbar.css({ width: Math.round((100 * interval) / delay) + "%" });
				},

				mouse_pos = function(e) {
					try {
						var IE = document.all ? true : false;
						if (!IE) document.captureEvents(Event.MOUSEMOVE);

						if (IE) {
							mouse.x = event.clientX + document.body.scrollLeft;
							mouse.y = event.clientY + document.body.scrollTop;
						} else {
							mouse.x = e.pageX;
							mouse.y = e.pageY;
						}
					} catch(e) {}
				},

				resize = function() {

					offsetW = self.width();
					if (offsetW >= 1200) 					{ self.addClass("eb-xl"); } else { self.removeClass("eb-xl"); }
					if (offsetW < 1200 && offsetW >= 992) 	{ self.addClass("eb-lg"); } else { self.removeClass("eb-lg"); }
					if (offsetW < 992 && offsetW >= 768) 	{ self.addClass("eb-md"); } else { self.removeClass("eb-md"); }
					if (offsetW < 768 && offsetW >= 480) 	{ self.addClass("eb-sm"); } else { self.removeClass("eb-sm"); }
					if (offsetW < 480) 						{ self.addClass("eb-xs"); } else { self.removeClass("eb-xs"); }

					init_slides();

				};

			// ATTACH EVENTS
			navi_next.mousedown( 		function(e){ next_slide(); e.stopPropagation(); return false });
			navi_next.on("touchstart", 	function(e){ next_slide(); e.stopPropagation(); return false });

			navi_prev.mousedown( 		function(e){ prev_slide(); e.stopPropagation(); return false });
			navi_prev.on("touchstart", 	function(e){ prev_slide(); e.stopPropagation(); return false });
			
			self.mouseover( 			function(){ stop_timer = true });
			self.mouseout( 				function(){ stop_timer = false });

			self.mouseup( 				function(e){ banner_mouseup(e); e.stopPropagation(); return false });
			self.mousemove( 			function(e){ banner_mousemove(e); e.stopPropagation(); return false });
			self.mousedown( 			function(e){ banner_mousedown(e); e.stopPropagation(); return false });
			self.on("touchstart", 		function(e){ banner_mousedown(e.originalEvent);  });
			self.on("touchmove", 		function(e){ banner_mousemove(e.originalEvent); });
			self.on("touchend", 		function(e){ banner_mouseup(e.originalEvent);  });
			self.on("touchcancel", 		function(e){ banner_mouseup(e.originalEvent); });

			$(document).keydown( function(e){ banner_keydown(e) });

			$(window).mouseup( 			function(e){ banner_mouseup(e) });
			$(window).mousemove( 		function(e){ banner_mousemove(e.originalEvent) });
			$(window).on("touchmove", 	function(e){ banner_mousemove(e.originalEvent) });
			$(window).on("touchend", 	function(e){ banner_mouseup(e.originalEvent) });
			$(window).on("touchcancel", function(e){ banner_mouseup(e.originalEvent) });
			$(window).on(resizeEvent, 	function(){ resize() });

			slides.find("img").attr('draggable', false);										// disable images dragging
			slides.find("img").mousemove( function(e){ banner_mousemove(e); return false });	// Drag fix for IE8

			slides.each(function(index){
				var me 	= $(this),
					vid = me.find("> video");

				if (vid.length) {
					// APPLY INDIVIDUAL VIDEO SETTINGS
					vid.loop 		= typeof me.data("loop") 		!= "undefined" ? parseBool(me.data("loop")) 	: video_loop;
					vid.muted 		= typeof me.data("muted") 		!= "undefined" ? parseBool(me.data("muted")) 	: video_muted;
					vid.autoplay 	= typeof me.data("autoplay") 	!= "undefined" ? parseBool(me.data("autoplay")) : video_autoplay;
					vid.controls 	= typeof me.data("controls") 	!= "undefined" ? parseBool(me.data("controls")) : video_controls;
					vid.preload 	= typeof me.data("preload") 	!= "undefined" ? parseBool(me.data("preload")) 	: video_preload;

					// AUTOPLAY IF 
					if ( index == 0 && video_autoplay ) vid.get(0).play();
					if ( vid.loop ) vid.on('ended', function(){ this.play() });
				}

			});

			// RUN
			resize();
			init_pagination();
			update_pagination();
			animate_slogan();
			setInterval(function(){ timer_tick() }, 10);
			setTimeout(function(){ resize() }, 100);

		});

	};

})(jQuery);


$(window).on("load", function() {

	var banners = $(".epic-banner").s46EpicBanner({
		ratio: 3.339130434782609,
		max_height: 575
	});

});