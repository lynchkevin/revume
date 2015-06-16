module.exports = function(grunt) {

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
            endpoint: 'http://192.168.1.167:5000',
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
            endpoint: 'https://m.volerro.com',
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
    }
    });
    grunt.loadNpmTasks('grunt-ng-constant');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-run');
    
    grunt.registerTask('dev', function () {
      grunt.task.run([
        'ngconstant:development'
      ]);
      grunt.task.run([
        'run'
      ]);
    });
    
    grunt.registerTask('prod', function () {
      grunt.task.run([
        'ngconstant:production'
      ]);
      grunt.task.run([
          'compress'
      ]);
    });

};
