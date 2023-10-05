## `12mb.nhd`

FreeDOS(98)がインストールされた、ハードディスクのベースイメージです。
これに『にせなぐりまくりたわあ』のゲームファイルをコピーして起動用のイメージを作ります。（『ALICEの館3』の圧縮展開後のサイズは10MBほどなので、セーブデータを合わせても12MBあれば十分です。）

`12mb.nhd` は以下のようにして作成しました。

1. [makehdi](https://github.com/lpproj/mydosuty/tree/master/makehdi)コマンドでイメージを作成

        makehdi -c 180 -h 8 -s 17 12mb.nhd

2. FreeDOS(98)のFDイメージ (fd98_2hd144_20220123.zip) を[ダウンロード](https://github.com/lpproj/fdkernel/releases/tag/test-20220120-cherrypick)
3. `12mb.nhd` と `fd98_2hd.img` をマウントしてPC-98エミュレータ(NP2)を起動。以下のステップはFreeDOSのコマンドライン上で行います。
4. `btnpart` コマンドでハードディスクをフォーマット
5. フォーマットしたHDDを認識させるため、エミューレータをリセット
6. FreeDOSシステムをHDDに転送

        A:\> sys C:

7. `FDXMS286.SYS` をHDDにコピー

        A:\> copy FDXMS286.SYS C:

8. カーネルオプションを設定して起動時にキー待ちをしないようにする

        A:\> sys config C:KERNEL.SYS SKIPCONFIGSECONDS=0

9. エミュレータを終了
10. [DiskExplorer](https://hp.vector.co.jp/authors/VA013937/editdisk/index.html)などを使ってNP2付属の `POWEROFF.COM` を `12mb.nhd` 内にコピー
