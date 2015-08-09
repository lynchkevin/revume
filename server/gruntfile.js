module.exports = function(grunt) {
    
    grunt.option('ip','http://192.168.1.100:5000');
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
          }
        }
      },
      production: {
        options: {
          dest: '../www/js/config.js'
        },
        constants: {
          baseUrl: {
            name: 'production',
            endpoint: 'http://m.revu.me',
            volerro: 'https://rb.volerro.com'
          }
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
    }
});
    grunt.loadNpmTasks('grunt-ng-constant');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-run');
    grunt.loadNpmTasks('grunt-env');    
    grunt.loadNpmTasks('grunt-angular-templates');    
    
    grunt.registerTask('dev', function () {
        grunt.log.writeln("ip is: " + grunt.option("ip"));
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
        'run'
      ]);
    });
    
    grunt.registerTask('prod', function () {
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
          'compress'
      ]);
    });

};
