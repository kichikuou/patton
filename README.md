# にせなぐりまくりたわあ on Web

これは、『ALICEの館3』収録の『にせなぐりまくりたわあ』を動かすためのWebアプリです。

『にせなぐりまくりたわあ』は[配布フリー宣言](https://www.alicesoft.com/about/#cont08)対象のゲームですが
Windows移植版が存在せず、鬼畜王 on Webでも動作しなかったため、長らく遊ぶのが難しい状態でした。

## 起動方法

[アリスソフト アーカイブズ](http://retropc.net/alice/)で『ALICEの館3』の **PC-9801版 ディスクイメージ** をダウンロードし、
YAKATA3_98.ZIP を[鬼畜王 on Web](https://kichikuou.github.io/web/)にドラッグ＆ドロップしてください。
『ALICEの館3』が起動しますので、ゲーム選択から『にせなぐりまくりたわあ』を選んでください。

## 技術情報

『ALICEの館3』はオリジナルのPC-98版においても2つのプログラムに分かれており、『にせなぐりまくりたわあ』だけは
（闘神都市2ベースの?）専用プログラムで実行されていました。ゲーム選択で『にせなぐりまくりたわあ』が選ばれると、
今まで動作していたプログラムが一旦終了して、この専用プログラムが実行されます。

鬼畜王 on Webにおいては、ユーザーがYAKATA3_98.ZIPをドロップすると、フロッピーディスクイメージ内のファイルを抽出して
『ALICEの館3』を立ち上げます。『にせなぐりまくりたわあ』以外の部分はWindows移植版プログラムを基にした
[system3-sdl2](https://github.com/kichikuou/system3-sdl2)エンジンで実行されます。

ゲーム選択で『にせなぐりまくりたわあ』が選ばれると、ゲームファイルを一時的な領域に保存して
『にせなぐりまくりたわあ on Web』のページに遷移します。『にせなぐりまくりたわあ on Web』はこれらのファイルから
PC-98のハードディスクイメージを構築します。

『ALICEの館3』にはオペレーティングシステムが含まれていないため、PC-98で動作するMS-DOS互換のOSが必要です。
ここで使っている[ハードディスクのベースイメージ](dist/12mb.nhd)には、
[FreeDOS(98)のDBCS対応版](http://bauxite.sakura.ne.jp/software/dos/freedos.htm)がインストールされています。
[assets/README.md](assets/README.md)も参照してください。

ハードディスクイメージにゲームファイルをコピーしたら、PC-98エミュレータ[Neko Project II](https://www.yui.ne.jp/np2/)の
[ブラウザ移植版](https://github.com/irori/np2-wasm)を使ってゲームを起動します。
ハードディスクイメージはブラウザ内に保存されるので、セーブデータは次回起動時にロードできます。

## ライセンス

このリポジトリに含まれるソースコードは[MITライセンス](LICENSE)に従います。

[np2-wasm](https://github.com/irori/np2-wasm)は
[3条項BSDライセンス](https://github.com/irori/np2-wasm/blob/main/LICENSE)でライセンスされています。

[ハードディスクイメージ](dist/12mb.nhd)に含まれるFreeDOS(98)システムは
[GPL 2.0](https://github.com/lpproj/fdkernel/blob/nec98test/COPYING)でライセンスされています。
