const gulp = require('gulp')
const inlinesource = require('gulp-inline-source')
const htmlmin = require('gulp-htmlmin') // html压缩组件
const removeEmptyLines = require('gulp-remove-empty-lines') // 清除空白行，参考
const babel = require('gulp-babel') // 编译se6
const uglify = require('gulp-uglify') // js文件压缩
const csso = require('gulp-csso') // CSS压缩
const imagemin = require('gulp-imagemin') // 图片压缩
const del = require('del') // 删除文件
const changed = require('gulp-changed')
const path = require('path')
const pug = require('gulp-pug')
const less = require('gulp-less')
// const cache = require('gulp-cache')
const gulpif = require('gulp-if')
const postcss = require('gulp-postcss')
const sourcemaps = require('gulp-sourcemaps')
const autoprefixer = require('autoprefixer')

const isDev = process.env.NODE_ENV !== 'production'

const paths = {
  src: 'src',
  tmp: 'tmp',
  dist: 'dist'
}
const files = {
  srcHTML: paths.src + '/**/*.html',
  srcPug: [paths.src + '/**/*.pug', '!' + paths.src + '/layout/*'],
  srcCSS: [paths.src + '/css/**/*.css', '!' + paths.src + '/common/*'],
  srcLess: [paths.src + '/css/**/*.less', '!' + paths.src + '/common/*'],
  srcJS: paths.src + '/script/**/*.js',
  srcImg: paths.src + '/image/**/*.{png,jpg,gif,ico}',
  srcRes: paths.src + '/res/*',
  tmpHTML: [paths.tmp + '/**/*.html'],
  tmpCSS: paths.tmp + '/**/*.css',
  tmpJS: paths.tmp + '/**/*.js',
  tmpMap: paths.tmp + '/**/*.map',
  distHTML: paths.dist + '/**/*.html',
  distCSS: paths.dist + '/**/*.css',
  distJS: paths.dist + '/**/*.js',
  distImg: paths.dist + '/image/*.{png,jpg,gif,ico}',
  distRes: paths.src + '/res/*'
}

const AUTOPREFIXER_BROWSERS = [
  '> 0.1%',
  'not ie > 0',
  'not firefox > 0',
  'not UCAndroid > 0',
  'not Edge > 0',
  'not ie_mob > 0',
  'not QQAndroid > 0',
  'not FirefoxAndroid > 0',
  'not Baidu > 0'
]

gulp.task('clean:all', function(cb) {
  del([paths.tmp, path.join(paths.dist, '/html'), path.join(paths.dist, '/css'), path.join(paths.dist, '/script'), path.join(paths.dist, '/image'), path.join(paths.dist, '/res')], { force: true })
  cb()
})
gulp.task('clean:html', function(cb) {
  del([files.distHTML])
  cb()
})
gulp.task('clean:js', function(cb) {
  del([files.distJS])
  cb()
})
gulp.task('clean:css', function(cb) {
  del([files.distCSS])
  cb()
})
gulp.task('clean:img', function(cb) {
  del([files.distImg])
  cb()
})
gulp.task('clean:res', function(cb) {
  del([files.distRes])
  cb()
})

// 处理js
gulp.task('minifyjs', function() {
  return (
    gulp
      .src(files.srcJS)
      .pipe(changed(paths.tmp + '/script'))
      .pipe(babel({ presets: ['env'] })) // 编译se6
      .pipe(gulpif(!isDev, uglify({
        output: {
          // comments: 'some'
        }
      }))) // 压缩
      .pipe(gulp.dest(paths.tmp + '/script'))
  ) // 输出
})

// 处理CSS
gulp.task('csscompress', function() {
  return gulp
    .src(files.srcCSS)
    .pipe(changed(paths.tmp + '/css'))
    .pipe(gulpif(isDev, sourcemaps.init()))
    .pipe(postcss([ autoprefixer({ browsers: AUTOPREFIXER_BROWSERS }) ]))
    .pipe(gulpif(!isDev, csso())) // 压缩CSS文件
    .pipe(gulpif(isDev, sourcemaps.write('.')))
    .pipe(gulp.dest(paths.tmp + '/css'))
})

// 处理Less
gulp.task('less', function() {
  return gulp
    .src(files.srcLess)
    .pipe(changed(paths.tmp + '/css'))
    .pipe(gulpif(isDev, sourcemaps.init()))
    .pipe(less()) // 压缩CSS文件
    .pipe(postcss([ autoprefixer({ browsers: AUTOPREFIXER_BROWSERS }) ]))
    .pipe(gulpif(!isDev, csso())) // 压缩CSS文件
    .pipe(gulpif(isDev, sourcemaps.write('.')))
    .pipe(gulp.dest(paths.tmp + '/css'))
})

// 压缩图片
gulp.task('img', function() {
  return gulp
    .src(files.srcImg)
    .pipe(imagemin())
    .pipe(gulp.dest(paths.dist + '/image'))
})

// 拷贝image
gulp.task('copyimg', function() {
  return gulp
    .src(files.srcImg)
    .pipe(gulp.dest(paths.dist + '/image')) // 输出
})

// 拷贝xml
gulp.task('copyxml', function() {
  return gulp
    .src(paths.src + '/config.xml')
    .pipe(gulp.dest(paths.dist)) // 输出
})

// 拷贝css文件
gulp.task('copycss', function() {
  return gulp
    .src(files.tmpCSS)
    .pipe(changed(files.tmpCSS))
    .pipe(gulp.dest(paths.dist)) // 输出
})
// 拷贝js文件
gulp.task('copyjs', function() {
  return gulp
    .src(files.tmpJS)
    .pipe(changed(files.tmpJS))
    .pipe(gulp.dest(paths.dist)) // 输出
})
// 拷贝map文件
gulp.task('copymap', function() {
  return gulp
    .src(files.tmpMap)
    .pipe(changed(files.tmpMap))
    .pipe(gulp.dest(paths.dist)) // 输出
})
// 拷贝res文件
gulp.task('copyres', function() {
  return gulp
    .src(files.srcRes)
    .pipe(changed(files.srcRes))
    .pipe(gulp.dest(paths.dist)) // 输出
})

gulp.task('inlinesource', function() {
  let options = {
    attribute: false,
    compress: false
    // handlers: (source, context) => {
    //   if (source.fileContent && !source.content) {
    //     switch (source.type) {
    //       case 'css':
    //         source.content = "Hey! I'm overriding the file's content!"
    //         break
    //       case 'js':
    //         source.content = "Hey! I'm overriding the file's content!"
    //         break
    //     }
    //   }
    //   return Promise.resolve()
    // },
  }
  return gulp
    .src(files.tmpHTML)
    // .pipe(changed(paths.tmp))
    .pipe(gulpif(!isDev, inlinesource(options)))
    .pipe(gulp.dest(paths.dist))
})

// 处理pug
gulp.task('pug', function() {
  return gulp
    .src(files.srcPug)
    .pipe(changed(paths.tmp))
    .pipe(pug({
      pretty: isDev
      // Your options in here.
    }))
    .pipe(gulp.dest(paths.tmp))
})

// 处理html
gulp.task('html', function() {
  let options = {
    removeComments: true, // 清除HTML注释
    collapseWhitespace: true, // 压缩HTML
    collapseBooleanAttributes: true, // 省略布尔属性的值 <input checked="true"/> ==> <input />
    removeEmptyAttributes: true, // 删除所有空格作属性值 <input id="" /> ==> <input />
    removeScriptTypeAttributes: true, // 删除<script>的type="text/javascript"
    removeStyleLinkTypeAttributes: true, // 删除<style>和<link>的type="text/css"
    // minifyJS: true,//压缩页面JS
    minifyCSS: true // 压缩页面CSS
  }
  return gulp
    .src(files.srcHTML)
    .pipe(changed(paths.tmp))
    .pipe(
      gulpif(isDev,
        removeEmptyLines({ removeComments: true })), // 清除空白行
      htmlmin(options))
    .pipe(gulp.dest(paths.tmp))
})

gulp.task('build', gulp.series('clean:all', ['img', 'copyxml', 'copyres', 'csscompress', 'less', 'minifyjs'], ['html', 'pug'], 'inlinesource'))

gulp.task('buildt', gulp.series(['img', 'copyxml', 'copyres', 'csscompress', 'less', 'minifyjs'], ['html', 'pug'], 'inlinesource'))

gulp.task('copyfile', gulp.parallel('copycss', 'copyjs', 'copymap'))

gulp.task('default', function() {
  // gulp.watch(files.srcJS, gulp.series('minifyjs', ['html', 'pug'], 'inlinesource'))
  gulp.watch(files.srcJS, gulp.series('minifyjs'))
  gulp.watch(files.srcHTML, gulp.series('html', 'inlinesource'))
  gulp.watch(paths.src + '/**/*.pug', gulp.series('pug', 'inlinesource'))
  // gulp.watch(paths.src + '/**/*.css', gulp.series('csscompress', ['html', 'pug'], 'inlinesource'))
  // gulp.watch(paths.src + '/**/*.less', gulp.series('less', ['html', 'pug'], 'inlinesource'))
  gulp.watch(paths.src + '/**/*.css', gulp.series('csscompress'))
  gulp.watch(paths.src + '/**/*.less', gulp.series('less'))

  // gulp.watch(files.src + '/script/*.js', ['clean:js', 'minifyjs']);
  // gulp.watch(files.src + '/**/*.html', ['clean:html', 'html']);
  // gulp.watch(files.src + '/css/*.css', ['clean:css', 'csscompress']);
  if (isDev) {
    gulp.watch(files.tmpJS, gulp.series('copyjs'))
    gulp.watch(files.tmpCSS, gulp.series('copycss'))
    gulp.watch(files.tmpMap, gulp.series('copymap'))
  }

  // gulp.watch(files.src + '/script/vendor/*.js', ['clean:vendorjs', 'copyjs']);
  gulp.watch(files.srcImg, gulp.series('img'))
  gulp.watch(files.srcRes, gulp.series('copyres'))
  gulp.watch(files.src + '/config.xml', gulp.series('copyxml'))
  // gulp.watch(files.src + '/images/*.{png,jpg,gif,ico}', ['clean:js', 'testImagemin']);
})
