hello.init({

	sfdc: {
        
		name: 'SFDC',

		oauth: {
			version: 2,
			auth: 'https://login.salesforce.com/services/oauth2/authorize',
			grant: 'https://login.salesforce.com/services/oauth2/token',
			response_type: 'code'
		},

		scope: {
			basic: ''
		},
        
        scope_delim:' ',

		base: 'https://api.box.com/2.0/',

		get: {
			me: 'users/me',
			'me/files': 'files',
            'default': function(p, callback) {
                if (p.path.match('https://api.box.com/2.0/files/@{FILE_ID}/thumbnail.png')) {
                    // This is a file, return binary data
                    p.method = 'blob';
                }

                callback(p.path);
            }
		},

		wrap: {
			me: function(o) {
				if (o.id) {
					o.picture = o.thumbnail = o.avatar_url;
					if (o.login.match('@')) {
						o.email = o.login;
					}
				}

				return o;
			},

			'me/files': function(o) {
				if (Array.isArray(o)) {
					return {data:o};
				}

				return o;
			},
			'me/thumbs': function(o) {
					return {data:o};
			}
		},

		xhr: function(p) {
            p.proxy = true;
            p.proxy_response_type = 'proxy';
			return true;
		},

		jsonp: false
	}
});
