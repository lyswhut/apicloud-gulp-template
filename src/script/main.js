window.apiready = function() {
  const ver = window.api.version
  const sType = window.api.systemType
  const sVer = window.api.systemVersion
  const id = window.api.deviceId
  const model = window.api.deviceModel
  const name = window.api.deviceName
  const cType = window.api.connectionType
  const winName = window.api.winName
  const winWidth = window.api.winWidth
  const winHeight = window.api.winHeight
  const frameName = window.api.frameName || ''
  const frameWidth = window.api.frameWidth || ''
  const frameHeight = window.api.frameHeight || ''

  let str = `<ul>
<li>引擎版本信息: ${ver}</li>
<li>系统类型: ${sType}</li>
<li>系统版本: ${sVer}</li>
<li>设备标识: ${id}</li>
<li>设备型号: ${model}</li>
<li>设备名称: ${name}</li>
<li>网络状态: ${cType}</li>
<li>主窗口名字: ${winName}</li>
<li>主窗口宽度: ${winWidth}</li>
<li>主窗口高度: ${winHeight}</li>
<li>子窗口名字: ${frameName}</li>
<li>子窗口宽度: ${frameWidth}</li>
<li>子窗口高度: ${frameHeight}</li>
</ul>`

  window.$api.byId('sys-info').innerHTML = str
}
