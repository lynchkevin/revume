module.exports = function(grunt) {
    grunt.option('port','9000');
    grunt.option('ip','http://10.1.10.216:'+grunt.option('port'));
    grunt.option('home_ip','http://192.168.1.166:'+grunt.option('port'));
    //grunt.option('home_ip','http://192.168.1.109:'+grunt.option('port'));
    grunt.option('buildDate',new Date().toString('mmm d, yyyy h:M'));
    
    grunt.initConfig({
    ngconstant: {
      // Options for all targets
      options: {
        space: '  ',
        wrap: '"use strict";\n\n {%= __ngModule %}',
        name: 'config',
      },
      // Environment targets
      home: {
        options: {
          dest: '../www/js/config.js'
        },
        constants: {
          baseUrl: {
            name: 'development',
            endpoint: grunt.option('home_ip'),
            volerro: 'https://rb.volerro.com'
          },
          buildDate : grunt.option('buildDate'),
          clientTokenPath: grunt.option('home_ip')+'/api/braintree/client_token',
          redirectUrl:'http://localhost:'+grunt.option('port'),
          helloInitParams: {
              dropbox:'c4uikzug99og3rh',
              box:'fn4p272m1a8qh2e9izqkpryhvedhlz2z',
              google:'945597499290-u6mqigu75s49u8dihb4npueh5hcbft9q.apps.googleusercontent.com',
              windows:'000000004817AFBB',
              sfdc:'3MVG9sG9Z3Q1RlbdEH3x71mLE7rVL3IC9m79cM1uHudxEU6AoBtcQieypG.x7fj20dawZZ29LEudyxayDkMCj'
            },
            mainChannel:{name:'Revu.Me:User:Development'},
            IntercomToken:'kjyp8m8d',
        }
      },
      development: {
        options: {
          dest: '../www/js/config.js'
        },
        constants: {
          baseUrl: {
            name: 'development',
            endpoint: grunt.option('ip'),
            volerro: 'https://rb.volerro.com'
          },
          buildDate : grunt.option('buildDate'),
          clientTokenPath: grunt.option('ip')+'/api/braintree/client_token',
          redirectUrl:'http://localhost:'+grunt.option('port'),
          helloInitParams: {
              dropbox:'c4uikzug99og3rh',
              box:'fn4p272m1a8qh2e9izqkpryhvedhlz2z',
              google:'945597499290-u6mqigu75s49u8dihb4npueh5hcbft9q.apps.googleusercontent.com',
              windows:'000000004817AFBB',
              sfdc:'3MVG9sG9Z3Q1RlbdEH3x71mLE7rVL3IC9m79cM1uHudxEU6AoBtcQieypG.x7fj20dawZZ29LEudyxayDkMCj'
            },
          mainChannel:{name:'Revu.Me:User:Development'},
          IntercomToken:'kjyp8m8d',
        }
      },
      production: {
        options: {
          dest: '../www/js/config.js'
        },
        constants: {
          baseUrl: {
            name: 'production',
            endpoint: 'https://m.revu.me',
            volerro: 'https://rb.volerro.com'
          },
          buildDate : grunt.option('buildDate'),
          clientTokenPath:'https://m.revu.me/api/braintree/client_token',
          redirectUrl:'https://m.revu.me/',
          helloInitParams: {
              dropbox:'f9cdswrtfz1jsd9',
              box:'11rseev2g1yripmmx833cp5jhiqy82v2',
              google:'945597499290-106uaa9etsaft53ln0olrv8dbse6h9an.apps.googleusercontent.com',
              windows:'000000004C17505E',
              sfdc:'3MVG9sG9Z3Q1RlbdEH3x71mLE7o4tBdvBgDi8S7KMxAOEvtS4wwwdhHSi5N681cL3LHUcN8HrE4D8A74u31ax'
            },
            mainChannel:{name:'Revu.Me:User'},
            IntercomToken:'nqthq6k8',
        }
      }
    },
     compress: {
      main: {
        options: {
          archive: '/users/kevin/zip/archive.zip'
        },
        files: [
          {src: ['**/*'], dest: '.'}, // includes files in path and its subdirs
        ]
      }
    },
    run: {
        options: {
          // Task-specific options go here.
        },
        server: {
          cmd: 'node',
          args: ['server.js']
        },
        debug:{
            cmd:'node',
            args: ['--debug-brk','server.js']
        }      
    },
    env : {
        options : {
        //Shared Options Hash 
        },
        home : {
          MAIN_CHANNEL:'Revu.Me:User:Development',
          options : {
              replace : {
                  BASE_URL : grunt.option('home_ip'),
                  PORT:grunt.option('port'),
              },
          }
        },
        development : {
          MAIN_CHANNEL:'Revu.Me:User:Development',
          options : {
              replace : {
                  BASE_URL : grunt.option('ip'),
                  PORT:grunt.option('port'),
              },
          }
        },
        production : {
            MAIN_CHANNEL:'Revu.Me:User',
            options : {
                replace : {
                    BASE_URL : 'm.revu.me',
                }
            }
        }
    },
    ngtemplates: {
        RevuMe: {
            cwd : '../www/',
            src : 'templates/**.html',
            dest: '../www/js/revume.templates.js',
            options : {
                /*bootstrap: function(module,script) {
                    return 'angular.module(\'RevuMe\').run([\'$templateCache\',function($templateCache){\n\r'+script+'}]);';
                },*/
                htmlmin: {
                    collapseBooleanAttributes:      false,
                    collapseWhitespace:             true,
                    removeAttributeQuotes:          false,
                    removeComments:                 false, // Only if you don't use comment directives! 
                    removeEmptyAttributes:          false,
                    removeRedundantAttributes:      false,
                    removeScriptTypeAttributes:     false,
                    removeStyleLinkTypeAttributes:  false
                }
            }
        }
    },
    watch: {
        html: {
            files: ['../www/templates/*.html'],
            tasks: ['ngtemplates:RevuMe']
        }
    },
    shell: {
        watch: {
            command: 'grunt watch',
            options: {
                async: true
            }
        }
    },
    uglify:{
        options: {
            banner: '/* RevuMe - ' + '<%= grunt.template.today("yyyy-mm-dd") %> */',
            mangle: false,
        },
        javascript: {
            files: [{src:'../www/js/**/*.js', dest:'../www/revume.min.js'}]
        }
    },
    dev_prod_switch: {
            options: {
                environment: 'dev',
                env_char: '#',
                env_block_dev: 'env:dev',
                env_block_prod: 'env:prod'
            },
            all: {
                files: {
                '../www/index.html' : '../www/index.html'
                }
            }
    }
});
    grunt.loadNpmTasks('grunt-ng-constant');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-run');
    grunt.loadNpmTasks('grunt-env');    
    grunt.loadNpmTasks('grunt-angular-templates'); 
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-shell-spawn');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-dev-prod-switch');
    
    grunt.registerTask('dev', function (debug) {   
        grunt.log.writeln('debug is: ', grunt.option('debug'));
        grunt.log.writeln("ip is: " + grunt.option("ip"));
        grunt.log.writeln("buildDate: " + grunt.option('buildDate'));

        grunt.config.data.dev_prod_switch.options.environment = 'dev';

        grunt.task.run([
        'shell:watch'
        ]);
        grunt.task.run([
        'env:development'
        ]);
        grunt.task.run([
        'ngconstant:development'
        ]);
        grunt.task.run([
          'ngtemplates:RevuMe'
        ]);
        grunt.task.run([
          'dev_prod_switch'
        ]);        
        if(grunt.option('debug') == undefined){
            grunt.task.run([
            'run:server'
            ]);
        }else {
            grunt.task.run([
            'run:debug'
            ]);
        }
    });
    
    
    grunt.registerTask('home', function (debug) {
        grunt.option('port','9000');
        grunt.option('ip','http://192.168.1.166:'+grunt.option('port'));

        grunt.log.writeln("ip is: " + grunt.option("ip"));
        grunt.log.writeln("buildDate: " + grunt.option('buildDate'));

        grunt.config.data.dev_prod_switch.options.environment = 'dev';

        grunt.task.run([
        'shell:watch'
        ]);
        grunt.task.run([
        'env:home'
        ]);
        grunt.task.run([
        'ngconstant:home'
        ]);
        grunt.task.run([
          'ngtemplates:RevuMe'
        ]);
        grunt.task.run([
          'dev_prod_switch'
        ]);        
        if(grunt.option('debug') == undefined){
            grunt.task.run([
            'run:server'
            ]);
        }else {
            grunt.task.run([
            'run:debug'
            ]);
        }
    });
    
    
    grunt.registerTask('prod', function () {
        grunt.log.writeln('nocompress is: ', grunt.option('nocompress'));
        grunt.config.data.dev_prod_switch.options.environment = 'prod';

        grunt.task.run([
        'env:production'
        ]);   
        grunt.task.run([
        'ngconstant:production'
        ]);
        grunt.task.run([
          'ngtemplates:RevuMe'
        ]);

        if(grunt.option('nouglify') == undefined){
            grunt.task.run([
            'uglify:javascript'
            ]);
        } else {
            grunt.log.writeln('Uglify off - Setting Dev Prod to Dev');
            grunt.config.data.dev_prod_switch.options.environment = 'dev';
        }

        grunt.task.run([
          'dev_prod_switch'
        ]);  
        if(grunt.option('nocompress') == undefined){
            grunt.task.run([
            'compress'
            ]);
        }
    });

};
