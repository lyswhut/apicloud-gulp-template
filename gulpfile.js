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

const APICloud = require('apicloud-tools-core')

const isDev = process.env.NODE_ENV !== 'production'

const { paths, apicloudConfig } = require('./config')

const distPath = isDev ? paths.devDist : paths.prodDist

console.log(`=============================
src path: ${path.isAbsolute(paths.src) ? paths.src : path.join(__dirname, paths.src)}
tmp path: ${path.isAbsolute(paths.tmp) ? paths.tmp : path.join(__dirname, paths.tmp)}
dist path: ${path.isAbsolute(distPath) ? distPath : path.join(__dirname, distPath)}
=============================
`)

const files = {
  srcHTML: paths.src + '/**/*.html',
  srcPug: [paths.src + '/**/*.pug', '!' + paths.src + '/layout/**/*'],
  srcCSS: [paths.src + '/css/**/*.css', '!' + paths.src + '/common/**/*'],
  srcLess: [paths.src + '/css/**/*.less', '!' + paths.src + '/common/**/*'],
  srcJS: paths.src + '/script/**/*.js',
  srcImg: paths.src + '/image/**/*.{png,jpg,gif,ico,svg}',
  // srcSvg: paths.src + '/image/**/*.svg',
  srcRes: paths.src + '/res/*',
  tmpHTML: [paths.tmp + '/**/*.html'],
  tmpCSS: paths.tmp + '/**/*.css',
  tmpJS: paths.tmp + '/**/*.js',
  tmpMap: paths.tmp + '/**/*.map',
  distHTML: distPath + '/**/*.html',
  distCSS: distPath + '/**/*.css',
  distJS: distPath + '/**/*.js',
  distImg: distPath + '/image/*.{png,jpg,gif,ico,svg}',
  distRes: paths.src + '/res/*'
}

gulp.task('clean:all', function(cb) {
  del([paths.tmp, path.join(distPath, '/html'), path.join(distPath, '/css'), path.join(distPath, '/script'), path.join(distPath, '/image'), path.join(distPath, '/res')], { force: true })
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
      .pipe(changed((isDev ? distPath : paths.tmp) + '/script'))
      .pipe(babel({ presets: ['env'] })) // 编译se6
      .pipe(gulpif(!isDev, uglify({
        output: {
          // comments: 'some'
        }
      }))) // 压缩
      .pipe(gulp.dest((isDev ? distPath : paths.tmp) + '/script'))
  ) // 输出
})

// 处理CSS
gulp.task('csscompress', function() {
  return gulp
    .src(files.srcCSS)
    .pipe(changed((isDev ? distPath : paths.tmp) + '/css'))
    .pipe(gulpif(isDev, sourcemaps.init()))
    .pipe(postcss([ autoprefixer() ]))
    .pipe(gulpif(!isDev, csso())) // 压缩CSS文件
    .pipe(gulpif(isDev, sourcemaps.write('.')))
    .pipe(gulp.dest((isDev ? distPath : paths.tmp) + '/css'))
})

// 处理Less
gulp.task('less', function() {
  return gulp
    .src(files.srcLess)
    .pipe(changed((isDev ? distPath : paths.tmp) + '/css'))
    .pipe(gulpif(isDev, sourcemaps.init()))
    .pipe(less()) // 压缩CSS文件
    .pipe(postcss([ autoprefixer() ]))
    .pipe(gulpif(!isDev, csso())) // 压缩CSS文件
    .pipe(gulpif(isDev, sourcemaps.write('.')))
    .pipe(gulp.dest((isDev ? distPath : paths.tmp) + '/css'))
})

// 压缩图片
gulp.task('img', function() {
  return gulp
    .src(files.srcImg)
    .pipe(changed(distPath + '/image'))
    .pipe(imagemin())
    .pipe(gulp.dest(distPath + '/image'))
})

// 拷贝svg
// gulp.task('copysvg', function() {
//   return gulp
//     .src(files.srcSvg)
//     .pipe(changed(paths.tmp + '/image'))
//     .pipe(gulp.dest(paths.tmp + '/image')) // 输出
// })
// 拷贝image
gulp.task('copyimg', function() {
  return gulp
    .src(files.srcImg)
    .pipe(changed(distPath + '/image'))
    .pipe(gulp.dest(distPath + '/image')) // 输出
})

// 拷贝xml
gulp.task('copyxml', function() {
  return gulp
    .src(paths.src + '/config.xml')
    .pipe(gulp.dest(distPath)) // 输出
})
// 拷贝syncignore
gulp.task('copysyncignore', function() {
  return gulp
    .src(paths.src + '/.syncignore')
    .pipe(gulp.dest(distPath)) // 输出
})

// 拷贝css文件
gulp.task('copycss', function() {
  return gulp
    .src(files.tmpCSS)
    .pipe(changed(distPath))
    .pipe(gulp.dest(distPath)) // 输出
})
// 拷贝js文件
gulp.task('copyjs', function() {
  return gulp
    .src(files.tmpJS)
    .pipe(changed(distPath))
    .pipe(gulp.dest(distPath)) // 输出
})
// 拷贝map文件
gulp.task('copymap', function() {
  return gulp
    .src(files.tmpMap)
    .pipe(changed(distPath))
    .pipe(gulp.dest(distPath)) // 输出
})
// 拷贝res文件
gulp.task('copyres', function() {
  return gulp
    .src(files.srcRes)
    .pipe(changed(distPath))
    .pipe(gulp.dest(distPath)) // 输出
})

gulp.task('inlinesource', function() {
  let options = {
    attribute: false,
    compress: false,
    ignore: [ 'img' ]
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
    .pipe(changed(distPath))
    .pipe(inlinesource(options))
    .pipe(gulp.dest(distPath))
})

// 处理pug
gulp.task('pug', function() {
  return gulp
    .src(files.srcPug)
    .pipe(changed(isDev ? distPath : paths.tmp))
    .pipe(pug({
      pretty: isDev
      // Your options in here.
    }))
    .pipe(gulp.dest(isDev ? distPath : paths.tmp))
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
    .pipe(changed(isDev ? distPath : paths.tmp))
    .pipe(
      gulpif(isDev,
        removeEmptyLines({ removeComments: true })), // 清除空白行
      htmlmin(options))
    .pipe(gulp.dest(isDev ? distPath : paths.tmp))
})

gulp.task('asyncWIFI:all', cb => {
  APICloud.syncWifi({ projectPath: distPath, syncAll: true })
  cb()
})
gulp.task('asyncWIFI', cb => {
  APICloud.syncWifi({ projectPath: distPath, syncAll: false })
  cb()
})
gulp.task('stopWIFI', cb => {
  APICloud.endWifi({})
  cb()
})
gulp.task('startWIFI', cb => {
  if (!isDev && !apicloudConfig.buildSync) {
    console.log('跳过wifi同步')
    cb()
    return
  }
  APICloud.startWifi({ port: apicloudConfig.wifiPort })
  APICloud.wifiLog(({ level, content }) => {
    if (level === 'warn') {
      console.warn(content)
      return
    }
    if (level === 'error') {
      console.error(content)
      return
    }
    console.log(content)
  }).then(() => {
    console.log('WiFi 日志服务已启动...')
  })
  // console.log(APICloud.wifiInfo())
  const timer = time => {
    setTimeout(() => {
      console.log(`将在 ${time} 秒后进行全量wifi同步！`)
      if (--time > -1) return timer(time)
      console.log(`全量wifi同步开始...`)
      APICloud.syncWifi({ projectPath: distPath, syncAll: true })
      console.log(isDev ? `全量wifi同步指令已执行！` : `全量wifi同步指令已执行，同步完毕后请按 ctrl+c 结束命令行！`)
    }, 1000)
  }
  timer(apicloudConfig.syncTime)
  cb()
})

gulp.task('build', gulp.series('clean:all', ['img', 'copyxml', 'copysyncignore', 'copyres', 'csscompress', 'less', 'minifyjs'], ['html', 'pug'], 'inlinesource', 'startWIFI'))

gulp.task('buildt', gulp.series('clean:all', ['img', 'copyxml', 'copysyncignore', 'copyres', 'csscompress', 'less', 'minifyjs', 'html', 'pug']))

gulp.task('copyfile', gulp.parallel('copycss', 'copyjs', 'copymap'))

gulp.task('watch', function() {
  // gulp.watch(files.srcJS, gulp.series('minifyjs', ['html', 'pug'], 'inlinesource'))
  gulp.watch(files.srcJS, gulp.series('minifyjs', 'asyncWIFI'))
  gulp.watch(files.srcHTML, gulp.series('html', 'inlinesource', 'asyncWIFI'))
  gulp.watch(paths.src + '/**/*.pug', gulp.series('pug', 'inlinesource', 'asyncWIFI'))
  // gulp.watch(paths.src + '/**/*.css', gulp.series('csscompress', ['html', 'pug'], 'inlinesource'))
  // gulp.watch(paths.src + '/**/*.less', gulp.series('less', ['html', 'pug'], 'inlinesource'))
  gulp.watch(paths.src + '/**/*.css', gulp.series('csscompress', 'asyncWIFI'))
  gulp.watch(paths.src + '/**/*.less', gulp.series('less', 'asyncWIFI'))

  // gulp.watch(files.src + '/script/*.js', ['clean:js', 'minifyjs']);
  // gulp.watch(files.src + '/**/*.html', ['clean:html', 'html']);
  // gulp.watch(files.src + '/css/*.css', ['clean:css', 'csscompress']);
  // if (isDev) {
  //   gulp.watch(files.tmpJS, gulp.series('copyjs'))
  //   gulp.watch(files.tmpCSS, gulp.series('copycss'))
  //   gulp.watch(files.tmpMap, gulp.series('copymap'))
  // }

  // gulp.watch(files.src + '/script/vendor/*.js', ['clean:vendorjs', 'copyjs']);
  gulp.watch(files.srcImg, gulp.series('img', 'asyncWIFI'))
  gulp.watch(files.srcRes, gulp.series('copyres', 'asyncWIFI'))
  gulp.watch(files.src + '/config.xml', gulp.series('copyxml', 'asyncWIFI'))
  gulp.watch(files.src + '/.syncignore', gulp.series('copysyncignore'))
  // gulp.watch(files.src + '/images/*.{png,jpg,gif,ico}', ['clean:js', 'testImagemin']);
})

gulp.task('default', gulp.series('buildt', 'startWIFI', 'watch'))
