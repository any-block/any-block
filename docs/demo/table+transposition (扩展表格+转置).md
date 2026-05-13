# table+transposition (扩展表格+转置)

## demo1

[width(20)]

|*a*|*b*|
|:--|:--|
| c | d |

转置

[trs|width(20)]

|*a*|*b*|
|---|---|
| c | d |

## demo2

[table]

- 1
  - 2 | _
  - 3
    - 3.1
    - 3.2
- 4
  - 5
  - 6

转置

[table|trs]

- 1
  - 2 | _
  - 3
    - 3.1
    - 3.2
- 4
  - 5
  - 6

## demo3

[exTable]

|*A*| < | a |
|---|---|---|
| 1 | 2 | ^ |

转置

[trs|exTable|width(30)]

|*A*| < | a |
|---|---|---|
| 1 | 2 | ^ |

## demo4

[exTable]

|*A*| < | a |
|---|---|---|
| ^ | ^ | b |
| 1 | 2 | 3c|

转置

[trs|exTable]

|*A*| < | a |
|---|---|---|
| ^ | ^ | b |
| 1 | 2 | 3c|

## 规则化

[table|strictTable]

- 1
  - 1.1
  - 1.2
    - 1.2.1
    - 1.2.2

下面的例子中，必须在trs之前strictTable，否则转置可能不正常

[table|strictTable|trs]

- a | b | c | d
- 1 | 2 | 3 | 4 | 5 | 6 | 7
- ① | ② | ③

## 其他

(TODO `exTable + trs` 顺序反过来会有问题，有空研究下)

[exTable|trs]

|*A*| < | a |
|---|---|---|
| 1 | 2 | ^ |

[exTable|strictTable]

|*A*| < | a |
|---|---|---|
| 1 | 2 | ^ |
