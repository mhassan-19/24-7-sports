const { withAppBuildGradle } = require('expo/config-plugins');

/**
 * Windows build fix. The app's C++ step compiles each native library's codegen under
 * `android/app/.cxx`, and the object paths embed the full source path, so some exceed Windows'
 * 260-character limit ("Filename longer than 260 characters"). CMake shortens long object paths
 * with a hash when CMAKE_OBJECT_PATH_MAX is set; Windows host builds set it, Android builds don't.
 */
module.exports = function withShortNativePaths(config) {
  return withAppBuildGradle(config, (cfg) => {
    const gradle = cfg.modResults.contents;
    if (gradle.includes('CMAKE_OBJECT_PATH_MAX')) return cfg;
    cfg.modResults.contents = gradle.replace(
      /defaultConfig \{\n/,
      [
        'defaultConfig {',
        '        externalNativeBuild {',
        '            cmake {',
        '                arguments "-DCMAKE_OBJECT_PATH_MAX=240"',
        '            }',
        '        }',
        '',
      ].join('\n'),
    );
    return cfg;
  });
};
