module.exports = {
  // 路径配置
  paths: {
    src: 'src',
    tmp: 'tmp',
    devDist: 'dist', // 开发模式输出目录
    prodDist: 'dist' // 生产(打包)模式输出目录
    // prodDist: 'D:\\APICloud\\workspace\\bgs' // 生产(打包)模式输出目录
  },

  // apiCloud 配置
  apicloudConfig: {
    wifiPort: 10915, // 同步端口
    buildSync: true, // 打包完成后是否执行同步
    syncTime: 10 // 同步倒计时
  }
}
