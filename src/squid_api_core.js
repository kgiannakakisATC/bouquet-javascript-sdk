/*! Squid Core API V2.0 */
(function (root, squid_api, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD.
        define([], factory);
    } else {
        // Browser globals
        root[squid_api] = factory();
    }
    // just make sure console.log will not crash
    if (!root.console) {
        root.console = {
            log: function () {
            }
        };
    }
}(this, "squid_api", function () {

    // Squid API definition
    var squid_api = {
        debug: null,
        version: "3.0.0",
        DATE_FORMAT: "YYYY-MM-DDTHH:mm:ss.SSSZZ",
        apiHost: null,
        apiEnv: null,
        apiBaseURL : null,
        apiURL: null,
        apiURLParam : null,
        serverURL: null,
        loginURL: null,
        timeoutMillis: null,
        customerId: null,
        projectId: null,
        domainId: null,
        clientId: null,
        fakeServer: null,
        defaultShortcut: null,
        defaultConfig: null,
        swaggerURL: null,
        apiSchema: null,
        apiVersion: null,
        uri : null,
        browserOK : null,
        wsNotification : null,
        wsConnectionAttempts: 1,
        bouquetSessionId : null,
        options : {
            enableTracking : true
        },
        constants : {
            HEADER_BOUQUET_SESSIONID : "X-Bouquet-Session-Id"
        },
        obioURL : null,
        teamId : null,
        authCode : null,

        // declare some namespaces
        model: {},
        view: {},
        collection: {},
        controller: {},

        setApiURL: function (a1) {
            if (a1 && a1[a1.length - 1] == "/") {
                a1 = a1.substring(0, a1.length - 1);
            }
            this.apiURL = a1;
            console.log("apiURL : " + this.apiURL);
            return this;
        },

        setTimeoutMillis: function (t) {
            this.timeoutMillis = t;
            return this;
        },

        utils: {

            /**
             * Union of attributes of 2 objects.
             */
            mergeAttributes: function (obj1, obj2) {
                var obj = {};
                if (obj1) {
                    for (var att1 in obj1) {
                        obj[att1] = obj1[att1];
                    }
                }
                if (obj2) {
                    for (var att2 in obj2) {
                        obj[att2] = obj2[att2];
                    }
                }
                return obj;
            },

            /**
             * Deep find an object having a given property value and objectType in a JSON object.
             */
            find: function (theObject, key, value, objectType) {
                var result = null, i;
                if (theObject instanceof Array) {
                    for (i = 0; i < theObject.length; i++) {
                        result = this.find(theObject[i], key,
                            value, objectType);
                        if (result) {
                            break;
                        }
                    }
                } else {
                    for (var prop in theObject) {
                        if (prop == key) {
                            if (theObject[prop] == value) {
                                if (!objectType || (objectType == theObject.objectType)) {
                                    return theObject;
                                }
                            }
                        }
                        if ((theObject[prop] instanceof Object) || (theObject[prop] instanceof Array)) {
                            result = this.find(theObject[prop], key, value, objectType);
                            if (result) {
                                break;
                            }
                        }
                    }
                }
                return result;
            },

            /**
             * Streamline a selection (get rid of the facet items).
             */
            buildCleanSelection: function (selectionOpt) {
                var selection = {
                    "facets": [],
                	"rootFacets": []
                };
                if (selectionOpt) {
                    var facets = selectionOpt.facets;
                    if (facets) {
                        for (var is = 0; is < facets.length; is++) {
                            var facet = facets[is];
                            if (facet.selectedItems && (facet.selectedItems.length > 0)) {
                                var newFacet = {
                                    "selectedItems": facet.selectedItems,
                                    "dimension": facet.dimension,
                                    "id": facet.id
                                };
                                selection.facets.push(newFacet);
                            }
                        }
                    }
                    var rootFacets = selectionOpt.rootFacets;
                    if (rootFacets) {
                        for (var ir = 0; ir < rootFacets.length; ir++) {
                            var rootFacet = rootFacets[ir];
                            if (rootFacet.selectedItems && (rootFacet.selectedItems.length > 0)) {
                                var newRootFacet = {
                                    "selectedItems": rootFacet.selectedItems,
                                    "dimension": rootFacet.dimension,
                                    "id": rootFacet.id
                                };
                                selection.facets.push(newRootFacet);
                            }
                        }
                    }
                     // compare
                    selection.compareTo = selectionOpt.compareTo;
                }
                return selection;
            },
            
            /**
             * http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
             */
            hashCode : function(s) {
                var hash = 0;
                if (s.length === 0) return hash;
                for (i = 0; i < s.length; i++) {
                    char = s.charCodeAt(i);
                    hash = ((hash<<5)-hash)+char;
                    hash = hash & hash; // Convert to 32bit integer
                }
                return hash;
            },
            
            idToPath : function(id) {
                var path = "";
                for(var oid in id) {
                    path += "/"+oid.substring(0,oid.length-2)+"s/"+id[oid];
                }
                return path;
            },
            
            formatTime: function(v, d3Formatter, format) {
            	if (v!== 'undefined' && v) {
            		if (typeof v === 'string' || v instanceof String) {
            			v = parseFloat(v.replace(new RegExp(',', 'g'),''));
            		}
					var d = moment.duration(v, 'milliseconds');
					// obtain hours / minutes & seconds
					var hours = d.asHours();
					var minutes = d.asMinutes();
					var days = d.asDays();
					var years = d.asYears();
					var seconds = d.asSeconds();
					var milliseconds = d.asMilliseconds();
					var timeData = d._data;
					// contruct readable time values
					if (milliseconds > 1) {
						v = d3Formatter(Math.round(timeData.milliseconds * 100) / 100);
						if (seconds > 1) {
							v = timeData.seconds + "s";
							if (minutes > 1) {
								v = timeData.minutes + "m " + v;
								if (hours > 1) {
									v = timeData.hours + "h " + v;
									if (days > 1) {
										v = timeData.days + "d " + v;
										if (years > 1) {
											v = timeData.years + "y " + v;
										}
									}
								}
							}
						}
					}
            	}
				return v;
            }
        }
    };
    return squid_api;
}));
