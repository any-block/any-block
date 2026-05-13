# 装饰类

装饰处理器

就是把一个html转换为另一个html，并且通常是在第一个html的基础上追加点东西

最常用的是样式追加类，有三种：

- `addDiv`, eg: `addDiv(class1 class2)`
- `addClass`, eg: `addClass(class1 class2)`
- `addStyle`, eg: `addStyle( color:red;background:blue )` (注意最外的括号往内要加空格，避免与transfrom等有括号的属性冲突)

其中，addDiv是向外加一个div元素再加样式，addClass和Style是直接在原元素上加样式。

`addDiv(class1 class2)` 等同 `addDiv|addClass(class1 class2)`

## 横向滚动demo

```md
原效果

[table]
- 1111 1111 111111
	- 2222 2222 222222
		- 3333 3333 333333
			- 1111 1111 111111
				- 2222 2222 222222
					- 3333 3333 333333

ab表格 + 滚动处理器 (不加T表示纵向滚动)

[table|scrollT]
- 1111 1111 111111
	- 2222 2222 222222
		- 3333 3333 333333
			- 1111 1111 111111
				- 2222 2222 222222
					- 3333 3333 333333

ab表格 + 动态添加样式 (addDiv是向外加一个div元素再加样式，addClass和Style是直接在原元素上加样式)

[table|addDiv(ab-deco-scroll ab-deco-scroll-x)]
- 1111 1111 111111
	- 2222 2222 222222
		- 3333 3333 333333
			- 4444 4444 444444
				- 5555 5555 555555
					- 6666 6666 666666
						- 7777 7777 777777
```

## 普通表格也是一样

```md
原效果

|aaaa aaaa aaaa aaaa|aaaa aaaa aaaa aaaa|aaaa aaaa aaaa aaaa|aaaa aaaa aaaa aaaa|aaaa aaaa aaaa aaaa|aaaa aaaa aaaa aaaa|
|---|---|---|---|---|---|
|aaaa aaaa aaaa aaaa|aaaa aaaa aaaa aaaa|aaaa aaaa aaaa aaaa|aaaa aaaa aaaa aaaa|aaaa aaaa aaaa aaaa|aaaa aaaa aaaa aaaa|

普通表格 + 滚动处理器 (不加T表示纵向滚动)

[scrollT]

|aaaa aaaa aaaa aaaa|aaaa aaaa aaaa aaaa|aaaa aaaa aaaa aaaa|aaaa aaaa aaaa aaaa|aaaa aaaa aaaa aaaa|aaaa aaaa aaaa aaaa|
|---|---|---|---|---|---|
|aaaa aaaa aaaa aaaa|aaaa aaaa aaaa aaaa|aaaa aaaa aaaa aaaa|aaaa aaaa aaaa aaaa|aaaa aaaa aaaa aaaa|aaaa aaaa aaaa aaaa|

普通表格 + 动态添加样式 (addDiv是向外加一个div元素再加样式，addClass和Style是直接在原元素上加样式)

[addDiv(ab-deco-scroll ab-deco-scroll-x)]

|aaaa aaaa aaaa aaaa|aaaa aaaa aaaa aaaa|aaaa aaaa aaaa aaaa|aaaa aaaa aaaa aaaa|aaaa aaaa aaaa aaaa|aaaa aaaa aaaa aaaa|
|---|---|---|---|---|---|
|aaaa aaaa aaaa aaaa|aaaa aaaa aaaa aaaa|aaaa aaaa aaaa aaaa|aaaa aaaa aaaa aaaa|aaaa aaaa aaaa aaaa|aaaa aaaa aaaa aaaa|
```
