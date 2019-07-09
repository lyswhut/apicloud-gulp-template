const fs = require('fs')
const gulp = require('gulp')
const inlinesource = require('gulp-inline-source') // 内联插件
const htmlmin = require('gulp-htmlmin') // html压缩插件

// const babel = require('gulp-babel') // 编译se6
const rollup = require('gulp-better-rollup')
const babel = require('rollup-plugin-babel')
const resolve = require('rollup-plugin-node-resolve')
const commonjs = require('rollup-plugin-commonjs')

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

let distPath = isDev ? paths.devDist : paths.prodDist
const srcPath = path.isAbsolute(paths.src) ? paths.src : path.join(__dirname, paths.src)
// const tmpPath = path.isAbsolute(paths.tmp) ? paths.tmp : path.join(__dirname, paths.tmp)
distPath = path.isAbsolute(distPath) ? distPath : path.join(__dirname, distPath)

console.log(`=============================
src path: ${path.isAbsolute(paths.src) ? paths.src : path.join(__dirname, paths.src)}
tmp path: ${path.isAbsolute(paths.tmp) ? paths.tmp : path.join(__dirname, paths.tmp)}
dist path: ${distPath}
=============================
`)

const files = {
  srcHTML: paths.src + '/**/*.html',
  srcPug: [paths.src + '/**/*.pug', '!' + paths.src + '/layout/**/*'],
  srcCSS: [paths.src + '/css/**/*.css', '!' + paths.src + '/common/**/*'],
  srcLess: [paths.src + '/css/**/*.less', '!' + paths.src + '/common/**/*'],
  srcJS: paths.src + '/script/**/*.js',
  srcImg: paths.src + '/image/**/*.{png,jpg,gif,ico,svg}',
  srcFont: paths.src + '/fonts/**/*.{eot,ttf,woff,woff2}',
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
  distFont: distPath + '/fonts/**/*.{eot,ttf,woff,woff2}',
  distRes: paths.src + '/res/*'
}

gulp.task('clean:all', function(cb) {
  del([
    paths.tmp,
    path.join(distPath, '/html'),
    path.join(distPath, '/css'),
    path.join(distPath, '/script'),
    path.join(distPath, '/image'),
    path.join(distPath, '/fonts'),
    path.join(distPath, '/res')
  ], { force: true })
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
gulp.task('clean:font', function(cb) {
  del([files.distFont])
  cb()
})
gulp.task('clean:res', function(cb) {
  del([files.distRes])
  cb()
})

global.compareChange = {
  dependencies: {},
  cachedFile: new Map(),
  scriptRootPath: path.join(srcPath, '/script'),
  regExps: {
    matchImport: /^\s*(?:import[\s\n]+(?:(?:{[\w\s,\n\r-]+}|[\w\n\r-]+)[\s\n]+from[\s\n]+)?['"][./\w-]+['"]|(?:((?:const|let|var)?[\s\n]+(?:{[\w\s,\n\r-]+}|[\w\n\r-]+)|\w+)[\s\n]+=[\s\n]+)?require\(['"][./\w-]+['"]\))\s*;{0,1}\s*$/gm,
    matchPath: /^[\s\n\r\w-,{}]*(?:['"]([./\w-]+)['"]|require\(['"]([./\w-]+)['"]\))\s*;{0,1}\s*$/,
    matchExt: /(\.js)$/
  },
  addDependencies(sourceFile) {
    let matchResult = sourceFile.contents.toString().match(this.regExps.matchImport)
    let tempPath
    if (matchResult) {
      for (const item of matchResult) {
        tempPath = item.replace(this.regExps.matchPath, '$1')
        if (!tempPath.includes('./')) continue
        let filePath = path.join(path.dirname(sourceFile.path), tempPath).replace(this.regExps.matchExt, '')
        if (!fs.existsSync(filePath + '.js')) filePath = path.join(filePath, 'index')
        if (!this.dependencies[filePath]) this.dependencies[filePath] = new Set()
        global.compareChange.dependencies[filePath].add(sourceFile.path)
      }
    }
  },
  updateDependencies(sourceFile) {
    let filePath = sourceFile.path

    // remove all dependencies
    let temp
    for (const key of Object.keys(this.dependencies)) {
      temp = this.dependencies[key]
      if (temp.has(filePath)) temp.delete(filePath)
    }

    this.addDependencies(sourceFile)
  },

  updateDependenciesFile(sourceFile, stream) {
    let dependencies = this.dependencies[sourceFile.path.replace(this.regExps.matchExt, '')]
    // console.log(stream)
    if (dependencies) {
      let matchedPath = new Set()
      for (const _path of dependencies) {
        this.handleUpdateDependenciesFile(_path, stream, matchedPath)
      }
    }
  },

  handleUpdateDependenciesFile(filePath, stream, matchedPath) {
    if (matchedPath.has(filePath)) return
    matchedPath.add(filePath)
    let _filePath = filePath.replace(this.regExps.matchExt, '')
    let dependencies = this.dependencies[_filePath]
    if (dependencies && dependencies.size) {
      for (const _path of dependencies) {
        this.handleUpdateDependenciesFile(_path, stream, matchedPath)
      }
    } else {
      if (path.dirname(filePath) != this.scriptRootPath) return
      let file = this.cachedFile.get(filePath)
      if (file) {
        file.contents = fs.readFileSync(filePath)
        stream.push(file.clone())
        console.log('Update dependencie: ' + filePath)
      }
    }
  },

  async compareDependencies(stream, sourceFile, targetPath) {
    let targetStat

    if (!global.compareChange.cachedFile.has(sourceFile.path)) {
      global.compareChange.addDependencies(sourceFile)
      global.compareChange.cachedFile.set(sourceFile.path, sourceFile.clone())
    }

    targetStat = fs.statSync(targetPath)

    if (sourceFile.stat && sourceFile.stat.mtimeMs > targetStat.mtimeMs) {
      global.compareChange.cachedFile.set(sourceFile.path, sourceFile.clone())
      global.compareChange.updateDependencies(sourceFile)

      stream.push(sourceFile)
      global.compareChange.updateDependenciesFile(sourceFile, stream)
    }
  }
}

// 处理js
gulp.task('minifyjs', function() {
  return gulp.src(files.srcJS)
    .pipe(gulpif(isDev, changed(distPath + '/script', {
      hasChanged: global.compareChange.compareDependencies
    })))
  // .pipe(babel({ presets: ['@babel/preset-env'] })) // 编译se6
    .pipe(rollup({
      plugins: [babel({
        exclude: [
          'node_modules/**',
          'src/script/vendors/**'
        ]
      }), resolve(), commonjs()],

      // ignore THIS_IS_UNDEFINED warning
      // see https://github.com/rollup/rollup/issues/1518
      onwarn(warning, warn) {
        if (warning.code === 'THIS_IS_UNDEFINED') return
        warn(warning) // this requires Rollup 0.46
      }
    }, 'umd')) // 编译se6
    .pipe(gulpif(!isDev, uglify({
      output: {
        // comments: 'some'
      }
    }))) // 压缩
    .pipe(gulp.dest((isDev ? distPath : paths.tmp) + '/script'))
  // 输出
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

// 拷贝 font
gulp.task('copyfont', function() {
  return gulp
    .src(files.srcFont)
    .pipe(changed(distPath + '/fonts'))
    .pipe(gulp.dest(distPath + '/fonts')) // 输出
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
// 拷贝html文件
gulp.task('html', function() {
  return gulp
    .src(files.srcHTML)
    .pipe(changed(isDev ? distPath : paths.tmp))
    .pipe(gulp.dest(isDev ? distPath : paths.tmp))
})

// 内联代码处理
gulp.task('inlinesource', function() {
  let htmlminOptions = {
    removeComments: true, // 清除HTML注释
    collapseWhitespace: true, // 压缩HTML
    collapseBooleanAttributes: true, // 省略布尔属性的值 <input checked="true"/> ==> <input />
    removeEmptyAttributes: true, // 删除所有空格作属性值 <input id="" /> ==> <input />
    removeScriptTypeAttributes: true, // 删除<script>的type="text/javascript"
    removeStyleLinkTypeAttributes: true, // 删除<style>和<link>的type="text/css"
    // minifyJS: true,//压缩页面JS
    minifyCSS: true // 压缩页面CSS
  }
  let inlinesourceOptions = {
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
    // .pipe(changed(distPath))
    .pipe(htmlmin(htmlminOptions))
    .pipe(inlinesource(inlinesourceOptions))
    .pipe(gulp.dest(distPath))
})

// 处理pug
gulp.task('pug', function() {
  return gulp
    .src(files.srcPug)
    .pipe(changed(isDev ? distPath : paths.tmp))
    .pipe(pug({
      pretty: isDev,
      data: {
        isDev
      }
      // Your options in here.
    }))
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

gulp.task('build', gulp.series('clean:all', ['img', 'copyfont', 'copyxml', 'copysyncignore', 'copyres', 'csscompress', 'less', 'minifyjs', 'html', 'pug'], 'inlinesource', 'startWIFI'))

gulp.task('buildt', gulp.series('clean:all', ['img', 'copyfont', 'copyxml', 'copysyncignore', 'copyres', 'csscompress', 'less', 'minifyjs', 'html', 'pug']))

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
  gulp.watch(files.srcFont, gulp.series('copyfont', 'asyncWIFI'))
  gulp.watch(files.srcRes, gulp.series('copyres', 'asyncWIFI'))
  gulp.watch(files.src + '/config.xml', gulp.series('copyxml', 'asyncWIFI'))
  gulp.watch(files.src + '/.syncignore', gulp.series('copysyncignore'))
  // gulp.watch(files.src + '/images/*.{png,jpg,gif,ico}', ['clean:js', 'testImagemin']);
})

gulp.task('default', gulp.series('buildt', 'startWIFI', 'watch'))
