module.exports = function(grunt) {

    grunt.option('ip','http://10.1.10.216:5000');
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
          redirectUrl:grunt.option('ip')
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
          redirectUrl:'http://localhost/callback/'
        }
      }
    },
     compress: {
      main: {
        options: {
          archive: '/users/kevin/zip/archive.zip'
        },
        files: [
          {src: ['**'], dest: '.'}, // includes files in path and its subdirs
        ]
      }
    },
    run: {
        options: {
          // Task-specific options go here.
        },
        your_target: {
          cmd: 'node',
          args: [
            'server.js'
          ]
        }
    },
    env : {
        options : {
        //Shared Options Hash 
        },
        development : {
          options : {
              replace : {
                  BASE_URL : grunt.option('ip')
              },
          }
        },
        production : {
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
            banner: '/* RevuMe - ' + '<%= grunt.template.today("yyyy-mm-dd") %> */'
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
    
    grunt.registerTask('dev', function () {
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
        grunt.task.run([
        'run'
        ]);
    });
    
    grunt.registerTask('prod', function () {
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
      grunt.task.run([
          'uglify:javascript'
      ]);
      grunt.task.run([
          'dev_prod_switch'
      ]);  
      grunt.task.run([
          'compress'
      ]);
    });

};
