import { Context, Schema } from "koishi";
import * as uuid from "uuid";
export const name = "su-claude";
export const usage = `
## 使用该插件有一定被封号的可能，请自行承担风险。如有意外，插件开发者概不负责！

### 授权以及获取user-token

网页([登录](https://app.slack.com))后, 进入api配置页面([点我跳转](https://api.slack.com/))。

〉》点击 【Create an app】

​	〉》主页看见Your Apps并弹出窗口【Create an app】  〉》  点击【From scratch】

<img src="https://ikechan8370.com/upload/image-adfx.png" alt="截屏2023-04-18 09.10.56" style="zoom:23%;" />

​	〉》填写app名称以及选择工作空间（例：name: Bot, workspace: chat）	 〉》  点击【Create App】

​	〉》点击左侧边栏上的【OAuth & Permissions】	 〉》

<img src="https://ikechan8370.com/upload/image-fwbl.png" alt="截屏2023-04-18 09.10.56" style="zoom:23%;" />

下拉至【Scopes】卡片，在 【User Token Scopes】 项下添加权限，如下：

​channels:history,  channels:read,  channels:write,

groups:history,  groups:read,  groups:write,

​chat:write,  im:history,  im:write,  mpim:history,  mpim:write

下拉至【Scopes】卡片，在 【Bot Token Scopes】 项下添加权限，如下：

channels:history,  groups:history，im:history

<img src="https://ikechan8370.com/upload/image-vdln.png" alt="截屏2023-04-18 09.10.56" style="zoom:25%;" />

​	〉》选好scope后，点击左侧的App Home，点击中间的Edit给Bot起一个名字，这样就给App增加了一个机器人了。

​	〉》回到顶部【OAuth Tokens for Your Workspace】栏，点击【Install to Workspace】，然后确认授权即可

​	〉》然后点击左侧OAuth & Permissions回到权限页面，获取另外两个token。也就是OAuth Tokens for Your Workspace下面的两个token。第一个是用户token，第二个是bot token。没有bot token就不填就行。

### 获取 claude appid

<img src="https://ikechan8370.com/upload/image-xvci.png" alt="截屏2023-04-18 08.49.20" style="zoom:23%;" />



Credits
Thank you to:

- https://github.com/ikechan8370/chatgpt-plugin original NodeJS implementation
`;
export interface Config {
  userToken: string;
  botToken: string;
  appId: string;
  channelName: string;
}

export const Config: Schema<Config> = Schema.object({
  userToken: Schema.string().required().description("用户token"),
  botToken: Schema.string().description("bot token"),
  appId: Schema.string().required().description("claude appid"),
  channelName: Schema.string()
    .required()
    .description("频道名称，不存在的会自动创建"),
});

type ChatResponse = {
  text: string;
  channel: string;
  conversationId?: string;
};

export async function apply(ctx: Context, config: Config) {
  const Authenticator = (await import("claude-api")).default;
  const authenticator = new Authenticator(
    config.userToken,
    config.appId,
    false
  );
  let icn = "";
  let convID = uuid.v4();
  ctx
    .command("cld <content:text>", "与claude聊天")
    .usage("这样用：cld 聊天内容")
    .action(async (c, content) => {
      if (icn == "") {
        icn = await authenticator.newChannel(config.channelName);
      }
      const result: ChatResponse = await authenticator.sendMessage({
        text: content,
        channel: icn,
        timeoutMs: 600 * 1000,
        retry: 2,
        conversationId: convID,
      });
      convID = result.conversationId;
      return `<at id="${c.session.userId}"/> ${result.text}`;
    });
  ctx.command("cld.new", "开始新一轮的对话").action(async (c) => {
    convID = uuid.v4();
    return "开始新一轮的对话";
  });
}
