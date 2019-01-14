const fs = require('fs')
const path = require('path')

const jp = (...p) => p.length ? path.join(__dirname, 'src', ...p) : path.join(__dirname, 'src')

const fileName = process.argv[2]
const templateName = process.argv[3] || 'index'
const jsDir = '/script'
const cssDir = '/css'

if (!templateName) {
  console.log('请传入要创建的文件名，例如：npm run cv -- hahaha')
  process.exit(0)
}

const findFile = fileName => {
  const find = dirArr => {
    for (let i = 0, len = dirArr.length; i < len; i++) {
      let d = dirArr[i]
      if (fs.statSync(path.join(dir, d)).isDirectory()) continue
      if (d === fileName + '.pug') {
        return path.join(dir, d)
      } else if (d === fileName + '.html') {
        return path.join(dir, d)
      } else continue
    }
    return null
  }
  let dir = jp()
  let filePath = find(fs.readdirSync(dir))
  if (filePath) return filePath
  dir = jp('html')
  return find(fs.readdirSync(dir))
}
const createHTML = (newFileName, templateName, templatePath) => {
  let html = fs.readFileSync(templatePath, 'utf-8')
  // let r = /(link\([\w|=|"|'|,|.|/|\s]+\/)\w+(\.css["|']{1}\))/
  html = html.replace(new RegExp(`(link\\([\\w="',./\\s]+\\/)${templateName}(\\.css["']{1}\\))`), `$1${newFileName}$2`)
    .replace(new RegExp(`(script\\([\\w="',./\\s]+\\/)${templateName}(\\.js["']{1}\\))`), `$1${newFileName}$2`)
  const targetPath = jp('html', newFileName + path.extname(templatePath))
  fs.writeFileSync(targetPath, html)
  return targetPath
}
const createCSS = (newFileName, templateName) => {
  let filePath = jp(cssDir, `${templateName}.`)
  filePath = fs.existsSync(filePath + 'less') ? filePath + 'less' : fs.existsSync(filePath + 'css') ? filePath + 'css' : null
  if (filePath) {
    const targetPath = path.join(path.dirname(filePath), newFileName + path.extname(filePath))
    fs.copyFileSync(filePath, targetPath, fs.constants.COPYFILE_EXCL)
    return targetPath
  }
  console.log('找不到目标css文件：' + fileName)
  process.exit(0)
}
const createJS = (newFileName, templateName) => {
  let filePath = jp(jsDir, `${templateName}.js`)
  if (fs.existsSync(filePath)) {
    const targetPath = path.join(path.dirname(filePath), newFileName + path.extname(filePath))
    fs.copyFileSync(filePath, targetPath, fs.constants.COPYFILE_EXCL)
    return targetPath
  }
  console.log('找不到目标js文件：' + filePath)
  process.exit(0)
}

const templatePath = findFile(templateName)
if (!templatePath) {
  console.log('找不到目标模板文件：' + templateName)
  process.exit(0)
}

try {
  console.log('创建：', createHTML(fileName, templateName, templatePath))
  console.log('创建：', createCSS(fileName, templateName))
  console.log('创建：', createJS(fileName, templateName), '\n')
  console.log(fileName, '创建成功~')
} catch (err) {
  console.log('发生错误：', err)
}
