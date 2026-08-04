#!/usr/bin/env python3
"""通过 GitHub Git Data API 推送本地变更（绕过 git push 代理 502 问题）。"""
import json, base64, urllib.request, os, sys

TOKEN = "REDACTED_TOKEN"
REPO = "Lokeily/dianguard-site"
BRANCH = "main"
API = f"https://api.github.com/repos/{REPO}"

def api(method, path, body=None):
    url = f"{API}{path}" if path.startswith("/") else f"{API}/{path}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", f"token {TOKEN}")
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read()) if r.status != 204 else {}
    except urllib.error.HTTPError as e:
        print(f"API {method} {path} -> {e.code}: {e.read().decode()[:200]}")
        raise

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILES = ["index.html", "features.html", "how.html", "changelog.html", "disclaimer.html", "styles.css", "app.js"]

# 1. 获取当前 main 分支的最新 commit
ref = api("GET", f"/git/refs/heads/{BRANCH}")
parent_sha = ref["object"]["sha"]
print(f"当前 main HEAD: {parent_sha[:8]}")

# 2. 获取该 commit 的 tree
commit = api("GET", f"/git/commits/{parent_sha}")
base_tree = commit["tree"]["sha"]

# 3. 为每个文件创建 blob
tree_items = []
for f in FILES:
    content = open(os.path.join(ROOT, f), "rb").read()
    blob = api("POST", "/git/blobs", {"content": content.decode("utf-8"), "encoding": "utf-8"})
    tree_items.append({
        "path": f,
        "mode": "100644",
        "type": "blob",
        "sha": blob["sha"],
    })
    print(f"  blob: {f} ({len(content)} bytes)")

# 4. 创建新 tree
new_tree = api("POST", "/git/trees", {"base_tree": base_tree, "tree": tree_items})
print(f"新 tree: {new_tree['sha'][:8]}")

# 5. 创建 commit
new_commit = api("POST", "/git/commits", {
    "message": "site: 三大核心页面动效增强\n\n主页/技术原理/功能详解差异化动画 + 说明文字",
    "tree": new_tree["sha"],
    "parents": [parent_sha],
})
print(f"新 commit: {new_commit['sha'][:8]}")

# 6. 更新 main ref
api("PATCH", f"/git/refs/heads/{BRANCH}", {"sha": new_commit["sha"], "force": False})
print(f"已推送至 {BRANCH}")
