/* MgHoroscope Module */

/* Magic Mirror
 * Module: MgHoroscope
 *
 * By Mikhael GERBET https://github.com/MikhaelGerbet
 * MIT Licensed.
 */

Module.register("MMMgHoroscope",{

	// Default module config.
	defaults: {
		feeds: [
			{
				title: "Horoscope",
				url: "http://voyance.avigora.fr/rss/horoscope_hebdo.php",
				encoding: "UTF-8" //ISO-8859-1
			}
		],
		enableSigns: null,
		showSourceTitle: true,
		showPublishDate: true,
		showDescription: false,
		reloadInterval:  5 * 60 * 1000, // every 5 minutes
		updateInterval: 3 * 1000,
		animationSpeed: 2.5 * 1000,
		maxNewsItems: 0, // 0 for unlimited
		removeStartTags: '',
		removeEndTags: '',
		startTags: [],
		endTags: []
		
	},

	// Define required scripts.
	getScripts: function() {
		return [
			"moment.js",
			this.file("fonts/flaticon-zodiac/flaticon.css")
		];
	},

	// Define required translations.
	getTranslations: function() {
		// The translations for the defaut modules are defined in the core translation files.
		// Therefor we can just return false. Otherwise we should have returned a dictionairy.
		// If you're trying to build yiur own module including translations, check out the documentation.
		return false;
	},

	// Define start sequence.
	start: function() {
		Log.info("Starting module: " + this.name);

		// Set locale.
		moment.locale(config.language);

		this.newsItems = [];
		this.loaded = false;
		this.activeItem = 0;

		this.registerFeeds();

	},

	// Override socket notification handler.
	socketNotificationReceived: function(notification, payload) {
		if (notification === "NEWS_ITEMS") {
			this.generateFeed(payload);

			if (!this.loaded) {
				this.scheduleUpdateInterval();
			}

			this.loaded = true;
		}
	},

	// Override dom generator.
	getDom: function() {
		var wrapper = document.createElement("div");

		if (this.config.feedUrl) {
			wrapper.className = "small bright";
			wrapper.innerHTML = "The configuration options for the newsfeed module have changed.<br>Please check the documentation.";
			return wrapper;
		}

		if (this.activeItem >= this.newsItems.length) {
			this.activeItem = 0;
		}

		if (this.newsItems.length > 0) {
			//Remove selected tags from the beginning of rss feed items (title or description)

			if (this.config.removeStartTags == 'title' || 'both') {
				for (f=0; f<this.config.startTags.length;f++) {
					if (this.newsItems[this.activeItem].title.slice(0,this.config.startTags[f].length) == this.config.startTags[f]) {
						this.newsItems[this.activeItem].title = this.newsItems[this.activeItem].title.slice(this.config.startTags[f].length,this.newsItems[this.activeItem].title.length);
						}
				}
				
			}
				
			if (this.config.removeStartTags == 'description' || 'both') {
				
				if (this.config.showDescription) {
					for (f=0; f<this.config.startTags.length;f++) {
						if (this.newsItems[this.activeItem].description.slice(0,this.config.startTags[f].length) == this.config.startTags[f]) {
							this.newsItems[this.activeItem].title = this.newsItems[this.activeItem].description.slice(this.config.startTags[f].length,this.newsItems[this.activeItem].description.length);
							}
					}
				}
			
			}
			
			//Remove selected tags from the end of rss feed items (title or description)

			if (this.config.removeEndTags) {
				for (f=0; f<this.config.endTags.length;f++) {
					if (this.newsItems[this.activeItem].title.slice(-this.config.endTags[f].length)==this.config.endTags[f]) {
						this.newsItems[this.activeItem].title = this.newsItems[this.activeItem].title.slice(0,-this.config.endTags[f].length);
						}
				}
				
				if (this.config.showDescription) {
					for (f=0; f<this.config.endTags.length;f++) {
						if (this.newsItems[this.activeItem].description.slice(-this.config.endTags[f].length)==this.config.endTags[f]) {
							this.newsItems[this.activeItem].description = this.newsItems[this.activeItem].description.slice(0,-this.config.endTags[f].length);
								}
					}
				}
			
			}
			
			var zodiacIcon = document.createElement("span");
			zodiacIcon.className = "bright big light ";

			switch(this.newsItems[this.activeItem].title){
				case 'Bélier' : zodiacIcon.className += "flaticon-aries-zodiac-symbol-of-frontal-goat-head" ;break;			
				case 'Taureau' : zodiacIcon.className += "flaticon-taurus-bull-head-symbol-for-zodiac" ;break;	
				case 'Gémeaux' : zodiacIcon.className += "flaticon-gemini-zodiac-symbol-of-two-twins-faces" ;break;	
				case 'Cancer' : zodiacIcon.className += "flaticon-cancer-astrological-sign-of-crab-silhouette" ;break;	
				case 'Lion' : zodiacIcon.className += "flaticon-leo-zodiac-symbol-of-lion-head-from-side-view" ;break;	
				case 'Vierge' : zodiacIcon.className += "flaticon-virgo-woman-head-shape-symbol" ;break;	
				case 'Balance' : zodiacIcon.className += "flaticon-libra-balanced-scale-zodiac-symbol" ;break;	
				case 'Scorpion' : zodiacIcon.className += "flaticon-scorpion-shape" ;break;	
				case 'Sagittaire' : zodiacIcon.className += "flaticon-sagittarius-zodiac-symbol" ;break;	
				case 'Capricorne' : zodiacIcon.className += "flaticon-capricorn-goat-animal-shape-of-zodiac-sign" ;break;	
				case 'Verseau' : zodiacIcon.className += "flaticon-aquarius-water-container-symbol" ;break;	
				case 'Poissons' : zodiacIcon.className += "flaticon-pisces-astrological-sign-symbol" ;break;	
			}

			var title = document.createElement("div");
			title.className = "bright medium light";
			title.innerHTML = this.newsItems[this.activeItem].title;
			title.appendChild(zodiacIcon);
			wrapper.appendChild(title);

			var description = document.createElement("div");
			description.className = "small light";
			description.innerHTML = this.newsItems[this.activeItem].description;
			wrapper.appendChild(description);

		} else {
			wrapper.innerHTML = this.translate("LOADING");
			wrapper.className = "small dimmed";
		}

		return wrapper;
	},

	/* registerFeeds()
	 * registers the feeds to be used by the backend.
	 */

	registerFeeds: function() {
		for (var f in this.config.feeds) {
			var feed = this.config.feeds[f];
			this.sendSocketNotification("ADD_FEED", {
				feed: feed,
				config: this.config
			});
		}
	},

	/* registerFeeds()
	 * Generate an ordered list of items for this configured module.
	 *
	 * attribute feeds object - An object with feeds returned by the nod helper.
	 */
	generateFeed: function(feeds) {
		var newsItems = [];
		for (var feed in feeds) {
			var feedItems = feeds[feed];
			if (this.subscribedToFeed(feed)) {
				for (var i in feedItems) {
					var item = feedItems[i];
					item.sourceTitle = this.titleForFeed(feed);
					if(this.config.enableSigns){
						if(this.config.enableSigns.indexOf(item.sourceTitle)){
							newsItems.push(item);
						}
					}else{
						newsItems.push(item);
					}
				}
			}
		}
		newsItems.sort(function(a,b) {
			var dateA = new Date(a.pubdate);
			var dateB = new Date(b.pubdate);
			return dateB - dateA;
		});
		if(this.config.maxNewsItems > 0) {
			newsItems = newsItems.slice(0, this.config.maxNewsItems);
		}
		this.newsItems = newsItems;
	},

	/* subscribedToFeed(feedUrl)
	 * Check if this module is configured to show this feed.
	 *
	 * attribute feedUrl string - Url of the feed to check.
	 *
	 * returns bool
	 */
	subscribedToFeed: function(feedUrl) {
		for (var f in this.config.feeds) {
			var feed = this.config.feeds[f];
			if (feed.url === feedUrl) {
				return true;
			}
		}
		return false;
	},

	/* subscribedToFeed(feedUrl)
	 * Returns title for a specific feed Url.
	 *
	 * attribute feedUrl string - Url of the feed to check.
	 *
	 * returns string
	 */
	titleForFeed: function(feedUrl) {
		for (var f in this.config.feeds) {
			var feed = this.config.feeds[f];
			if (feed.url === feedUrl) {
				return feed.title || '';
			}
		}
		return '';
	},

	/* scheduleUpdateInterval()
	 * Schedule visual update.
	 */
	scheduleUpdateInterval: function() {
		var self = this;

		self.updateDom(self.config.animationSpeed);

		setInterval(function() {
			self.activeItem++;
			self.updateDom(self.config.animationSpeed);
		}, this.config.updateInterval);
	},

	/* capitalizeFirstLetter(string)
	 * Capitalizes the first character of a string.
	 *
	 * argument string string - Input string.
	 *
	 * return string - Capitalized output string.
	 */
	capitalizeFirstLetter: function(string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	}
});
