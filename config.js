module.exports = {
  // 路径配置
  paths: {
    src: 'src',
    tmp: 'tmp',
    dist: 'dist'
    // dist: 'F:\\APICloud\\workspace\\test'
  },

  // apiCloud 配置
  apicloudConfig: {
    wifiPort: 10915, // 同步端口
    buildSync: true, // 打包完成后是否执行同步
    syncTime: 10 // 同步倒计时
  }
}
