# plantuml

## pumlMindmap (puml思维导图)

[list2pumlMindmap]

- vue-demo/
	- build/
	- config/
	- node_modules/
	- src/
		- assets/
			- a/
				- b
		- components
		- App.vue
		- main.js
	- static/
	- test/

## pumlWBS (puml工作分解图)

[list2pumlWBS]

- vue-demo/
  - build/
  - config/
  - node_modules/
  - src/
    - < assets/
      - < a
        - b
        - < c
      - d
      - e
    - components
    - App.vue
    - main.js
  - static/
  - test/

## ActivityDiagram (活动图)

### 列表形式

[list2pumlActivityDiagram]

- lane l1:
  - start
  - group g1:
    - if condition a:
      - a branch
    - elif condition b:
      - b branch
      - stop
    - elif condition c:
      - c  branch
      - detach
    - else:
      - else branch
      - kill
  - switch flag11:
      - case flag12:
          - flag13
      - case flag14:
          - flag15
      - default:
          - flag16
- lane l2:
  - print('loop start')
  - while loop condition:
    - loop body
  - print('loop end')
- lane l1:
  - end

### python/缩进形式

语法类似python，用代码块转成列表再转换也是可以的

[code2list|list2pumlActivityDiagram]

```python
lane l1:
  start
  group g1:
    if condition a:
      a branch
    elif condition b:
      b branch
      stop
    elif condition c:
      c  branch
      detach
    else:
      else branch
      kill

  switch flag11:
      case flag12:
          flag13
          stop
      case flag14:
          flag15
          kill
      case falg16:
          flag17
      default:
          flag18

lane l2:
  print('loop start')
  while loop condition:
    loop body
  print('loop end')

lane l1:
  end
```

其中也可以用region注释在code2list的过程中表示缩进

region注释是一种多语言通用的语法，在多种IDE上均支持。这样写能够让代码完全合法 (是的，下面的代码能正确在python中运行)

[code2list|list2pumlActivityDiagram]

```python
#region lane l1:
#region group g1:
if 1==2:
    print('1==2')
elif 1==1:
    print('1==1')
else:
    print('1!=1 && 1!=2')
#endregion

a = 'flag3'
match a:
    case 'flag1':
        print('a is flag1')
    case 'flag2':
        print('a is flag2')
    case _:
        print('default')
#endregion

#region lane l2:
print('loop start')
while False:
    print('in loop body')
print('loop end')
#endregion

#region lane l1:
```

### 仅生成对应文本

[code2list|list2pumlActivityDiagramText|code(js)]

```python
lane l1:
  group g1:
    if condition a:
      a branch
    elif condition b:
      b branch
    else:
      else branch

  switch flag11:
      case flag12:
          flag13
      case flag14:
          flag15
      default:
          flag16

lane l2:
  print('loop start')
  while loop condition:
    loop body
  print('loop end')

lane l1:
```

### 其他扩展

关键字

- 组类：`lane group partition`
- 主要流程控制类：`if elif else, switch match case default, while`
- 其他：`start, stop kill detach end, break, fork, frok again, end fork, end merge`

这本质上是plantuml活动图的一种语法封装，可以见plantuml文档并配置生成文本，来调试或获取一些有用信息：https://plantuml.com/zh/activity-diagram-beta
