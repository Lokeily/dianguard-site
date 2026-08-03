# 地震哨兵 Dianguard 官网

Android 地震预警应用「地震哨兵」的官方展示与下载站点（GitHub Pages）。

- 在线访问: https://lokeily.github.io/dianguard-site/
- 版本更新页: https://lokeily.github.io/dianguard-site/changelog.html
- 免责声明:   https://lokeily.github.io/dianguard-site/disclaimer.html
- 应用仓库:   https://github.com/Lokeily/Earthquake-Sentinel

## 下载实时同步最新版

首页与下载区的 APK 链接、版本号、更新时间，均在每次打开页面时
实时读取 `Lokeily/Earthquake-Sentinel` 的最新 Release，
因此用户下载到的永远是最新版。

## 本地预览

仓库根目录即 GitHub Pages 发布目录：

```bash
python3 -m http.server 8000
```

浏览器打开 `http://localhost:8000` 即可。

## 更新日志维护

`changelog.html` 中的更新记录由 `tools/bake-changelog.js` 从
`Lokeily/Earthquake-Sentinel` 的 Release 自动生成。发新版后请执行：

```bash
GITHUB_TOKEN=xxx node tools/bake-changelog.js
```

未携带 token 时脚本也能跑，但容易撞到 GitHub 匿名限流。

## 说明

纯静态站点，无构建步骤。根目录即 GitHub Pages 发布目录。
修改后重跑部署脚本即可覆盖更新。
