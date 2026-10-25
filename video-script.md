# Taste Concierge — 演示视频脚本(Qloo,2.5 分钟,英文)

> 提交前用 API key 真跑一遍后录制。结构对齐 Qloo 的核心判据:
> "If your submission would work the same without Qloo, you're building the wrong thing."
> 所以视频的主线就是不断证明:拿掉 Qloo,产品就塌。

## 0:00–0:25 开场:没有 Qloo 的世界(User Value)
> "Ask an LLM to plan you an evening — dinner, a film, a playlist — and you
> get the popular answers. The same ten restaurants, the same blockbuster.
> Technically functional. Not actually good."

画面:并排展示"普通 LLM 回答"(千篇一律的推荐)。

## 0:25–0:50 The Interview(核心交互)
画面:真操作 taste-concierge-psi.vercel.app。
输入三个答案:
- Loved works: "Studio Ghibli films, Radiohead"
- Evening vibe: "Cozy, low-key, a little melancholic"
- Skip: "anything too intense"

> "Three answers. That's all the agent asks. Each one is resolved to real
> entities in Qloo's taste graph — 250 million of them."

镜头特写页面底部"Taste-graph seeds"行——显示解析出的实体名。

## 0:50–1:30 The Plan + 为什么是这些(Technical Quality + Qloo Fit)
画面:四张卡片逐一展示(dinner / film / playlist / gift),每张的 "why" 行。

> "Every pick carries its provenance: the affinity that connected it to your
> profile. And notice the playlist — it's seeded by the *film* we chose, not
> just your baseline taste. The music follows the night's centerpiece. That's
> cross-domain coherence, and it's only possible through the taste graph's
> entity affinities."

## 1:30–2:00 负反馈循环(差异化卖点)
画面:点掉 dinner 的推荐("not tonight ✕")→ 计划实时重排。

> "Dismiss anything. The rejection feeds back into your entity profile and
> the whole evening recomposes. Negative signals are first-class citizens —
> the plan converges on you, not on the average user."

## 2:00–2:25 The Honest Gap(诚实边界,评委好感项)
画面:留一个"no confident match"的槽位(真实出现的情况)。

> "And when the graph has no confident match, the agent says so. No
> confident match, no fake pick. Being honest beats being complete."

## 2:25–2:30 结尾
> "Taste Concierge: your evening, composed by the taste graph.
> Qloo-powered — and nothing without it."

## 录制清单
- [ ] API key 注入后端到端跑通
- [ ] 准备一个能稳定复现的"seed profile"(选解析成功率高的作品名)
- [ ] OBS 录屏 1080p + 英文旁白(或字幕)
- [ ] 上传 YouTube(unlisted 即可),URL 填入 Devpost 提交
