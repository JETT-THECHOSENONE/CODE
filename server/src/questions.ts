import type { QuizQuestion, QuizCategory, LocalizedText } from '@same-word/shared';

const t = (zh: string, en: string): LocalizedText => ({ zh, en });
const q = (id: string, category: QuizCategory, zh: string, en: string, a: [string,string], b: [string,string], c: [string,string]): QuizQuestion => ({
  id, category, text: t(zh,en), options: [
    {id:'A', text:t(...a)}, {id:'B', text:t(...b)}, {id:'C', text:t(...c)}
  ]
});

export const QUESTIONS: QuizQuestion[] = [
  q('life-001','life','周末空下来时，你更想？','On a free weekend, you would rather…',['出门走走','Go out'],['宅家充电','Recharge at home'],['临时起意','Decide spontaneously']),
  q('life-002','life','一起吃火锅时你最先下什么？','What goes into hotpot first?',['肉类','Meat'],['蔬菜','Vegetables'],['丸子豆制品','Balls and tofu']),
  q('life-003','life','旅行前你通常会？','Before a trip, you usually…',['详细规划','Plan everything'],['只订住宿','Book lodging only'],['到了再说','Improvise on arrival']),
  q('life-004','life','看到好吃的新品时？','When you see a tasty new product…',['立刻尝试','Try it now'],['先看评价','Read reviews'],['还是买熟悉的','Choose a favorite']),
  q('life-005','life','下雨天最适合？','A rainy day is best for…',['看电影','Movies'],['睡觉','Sleeping'],['散步听雨','A rain walk']),
  q('life-006','life','合照时你最常站哪里？','Where do you stand in group photos?',['中间','Center'],['边上','Side'],['哪里有空站哪里','Any open spot']),
  q('life-007','life','收到消息后你通常？','When a message arrives, you…',['秒回','Reply instantly'],['想好再回','Think first'],['忙完一起回','Batch replies later']),
  q('life-008','life','冰箱里最后一块蛋糕？','The last slice of cake in the fridge?',['直接吃掉','Eat it'],['问一圈再吃','Ask everyone'],['留给别人','Leave it']),
  q('life-009','life','聚会结束后你更可能？','After a party, you are more likely to…',['意犹未尽','Want more'],['刚刚好','Feel just right'],['需要独处','Need alone time']),
  q('life-010','life','出门忘带伞，你会？','You forgot an umbrella. You…',['冲进雨里','Run through rain'],['买一把','Buy one'],['等雨小点','Wait it out']),
  q('life-011','life','奶茶甜度选择？','Your milk tea sweetness?',['全糖','Full sugar'],['半糖','Half sugar'],['无糖','No sugar']),
  q('life-012','life','睡前最后一件事？','Last thing before sleep?',['看手机','Check phone'],['读点东西','Read'],['直接睡','Sleep directly']),
  q('life-013','life','买东西最看重？','What matters most when shopping?',['颜值','Looks'],['实用','Practicality'],['价格','Price']),
  q('life-014','life','约会提前多久到？','How early do you arrive?',['十分钟以上','10+ minutes'],['准点','On time'],['偶尔踩点','At the last second']),
  q('life-015','life','最理想的早餐？','Ideal breakfast?',['中式热食','Warm Chinese'],['面包咖啡','Bread and coffee'],['不吃早餐','Skip it']),
  q('imagination-001','imagination','如果动物会说话，你先找谁聊天？','If animals could talk, who first?',['猫','Cat'],['狗','Dog'],['鸟','Bird']),
  q('imagination-002','imagination','获得一种超能力？','Choose a superpower.',['飞行','Flight'],['隐身','Invisibility'],['读心','Mind reading']),
  q('imagination-003','imagination','时间机器只能用一次？','Use a time machine once?',['回到过去','Go to the past'],['看看未来','See the future'],['留给重要时刻','Save it']),
  q('imagination-004','imagination','云朵吃起来像什么？','What would clouds taste like?',['棉花糖','Cotton candy'],['冰淇淋','Ice cream'],['气泡水','Sparkling water']),
  q('imagination-005','imagination','被困在电影世界，你选？','Trapped in a movie world, choose…',['喜剧','Comedy'],['冒险','Adventure'],['科幻','Sci-fi']),
  q('imagination-006','imagination','月亮突然变色？','The moon changes color. It turns…',['蓝色','Blue'],['粉色','Pink'],['金色','Gold']),
  q('imagination-007','imagination','外星人来地球先带它看？','First place to show an alien?',['城市夜景','City lights'],['自然山水','Nature'],['美食街','Food street']),
  q('imagination-008','imagination','能住进一种建筑？','Live in one unusual home?',['树屋','Treehouse'],['城堡','Castle'],['太空站','Space station']),
  q('imagination-009','imagination','你的影子有一天独立行动？','Your shadow moves independently. You…',['追上它','Chase it'],['和它聊天','Talk to it'],['假装没看见','Ignore it']),
  q('imagination-010','imagination','世界只剩一种颜色？','Only one color remains. Choose…',['蓝','Blue'],['绿','Green'],['橙','Orange']),
  q('imagination-011','imagination','一本书能把你吸进去？','A book pulls you inside. You…',['寻找出口','Find an exit'],['探索世界','Explore'],['改写结局','Rewrite the ending']),
  q('imagination-012','imagination','醒来变成一种天气？','Wake up as weather?',['阳光','Sunshine'],['小雨','Drizzle'],['微风','Breeze']),
  q('imagination-013','imagination','给机器人一种情绪？','Give a robot one emotion?',['好奇','Curiosity'],['快乐','Joy'],['同理心','Empathy']),
  q('imagination-014','imagination','神奇门通往哪里？','A magic door leads to…',['童年','Childhood'],['海底','Underwater'],['另一个星球','Another planet']),
  q('imagination-015','imagination','只能和一种物品说话？','Talk to one kind of object?',['手机','Phones'],['书','Books'],['交通工具','Vehicles']),
  q('personality-001','personality','遇到分歧时你倾向？','During disagreement, you tend to…',['马上沟通','Talk now'],['冷静一下','Cool off'],['先让一步','Compromise first']),
  q('personality-002','personality','计划突然改变，你会？','Plans suddenly change. You…',['很兴奋','Feel excited'],['有点焦虑','Feel anxious'],['看情况','Go with it']),
  q('personality-003','personality','朋友难过时你更会？','When a friend is sad, you…',['给建议','Give advice'],['安静陪伴','Stay quietly'],['带他散心','Distract them']),
  q('personality-004','personality','做决定时更相信？','When deciding, trust…',['逻辑','Logic'],['直觉','Intuition'],['他人经验','Others’ experience']),
  q('personality-005','personality','被夸奖时你的反应？','When praised, you…',['开心接受','Accept happily'],['有点害羞','Feel shy'],['转移话题','Change topic']),
  q('personality-006','personality','新环境里你通常？','In a new environment, you…',['主动认识人','Meet people'],['等别人开口','Wait for others'],['先观察','Observe first']),
  q('personality-007','personality','任务很多时你会？','With many tasks, you…',['列清单','Make a list'],['先做最难的','Start hardest'],['凭感觉推进','Follow momentum']),
  q('personality-008','personality','你更容易记住？','You remember better…',['名字','Names'],['脸','Faces'],['发生的事','Events']),
  q('personality-009','personality','礼物更看重？','In a gift, you value…',['惊喜感','Surprise'],['实用性','Usefulness'],['心意','Thoughtfulness']),
  q('personality-010','personality','面对未知你更像？','Facing the unknown, you are…',['探险家','Explorer'],['规划师','Planner'],['观察者','Observer']),
  q('personality-011','personality','聊天冷场时你会？','When conversation stalls, you…',['主动找话题','Start a topic'],['享受安静','Enjoy silence'],['拿出手机','Check phone']),
  q('personality-012','personality','完成大目标后？','After a big achievement?',['庆祝一下','Celebrate'],['马上定新目标','Set a new goal'],['先休息','Rest']),
  q('personality-013','personality','你更在意过程还是结果？','Process or result?',['过程','Process'],['结果','Result'],['都重要','Both']),
  q('personality-014','personality','别人迟到时你会？','When someone is late, you…',['耐心等','Wait patiently'],['发消息确认','Message them'],['有点生气','Feel annoyed']),
  q('personality-015','personality','压力来临时最需要？','Under stress, you need…',['独处','Alone time'],['倾诉','Talk it out'],['立刻行动','Take action'])
];

export function pickQuestions(category: QuizCategory, total: number): QuizQuestion[] {
  const pool = QUESTIONS.filter(item => item.category === category);
  return [...pool].sort(() => Math.random() - .5).slice(0, Math.min(total, pool.length));
}
