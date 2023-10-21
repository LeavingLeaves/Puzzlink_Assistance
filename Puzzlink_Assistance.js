// ==UserScript==
// @name         Puzz.link Assistance
// @version      23.10.20.2
// @description  Do trivial deduction.
// @author       Leaving Leaves
// @match        https://puzz.link/p*/*
// @match        https://pzplus.tck.mn/p*/*
// @match        http://pzv.jp/p*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @grant        none
// @namespace    https://greasyfork.org/users/1192854
// ==/UserScript==

(function () {
    'use strict';

    const maxLoop = 30;
    const maxDfsCellNum = 50;
    let flg = true;
    let step = false;
    let board;

    //const list
    const cqnum = {
        quesmark: -2,
        block: -2,
        none: -1,
        wcir: 1,
        bcir: 2,
    }

    const canum = {
        none: -1,
        wcir: 1,
        bcir: 2,
    };

    const cqans = {
        none: 0,
        block: 1,
        light: 1,
        //shakashaka triangle
        bl: 2,
        br: 3,
        tr: 4,
        tl: 5,
        rslash: 31,
        lslash: 32,
    };

    const cques = {
        none: 0,
        ice: 6,
        block: 7,
        cir: 41,
        tri: 42,
    };

    const cqsub = {
        none: 0,
        dot: 1,
        green: 1,
        yellow: 2,
    };

    const qdir = {
        none: 0,
        up: 1,
        dn: 2,
        lt: 3,
        rt: 4,
    }

    const bqsub = {
        none: 0,
        cross: 2,
        arrow_up: 11,
        arrow_dn: 12,
        arrow_lt: 13,
        arrow_rt: 14,
    };

    const genrelist = [
        [/slither/, SlitherlinkAssist],
        [/yaji[lr]in/, YajilinAssist],
        [/simpleloop/, SimpleloopAssist],
        [/mas[yh]u/, MasyuAssist],
        [/(lightup|akari)/, AkariAssist],
        [/heyawake/, HeyawakeAssist],
        [/shakashaka/, ShakashakaAssist],
        [/ayeheya/, EkawayehAssist],
        [/nothree/, NothreeAssist],
        [/lits/, LitsAssist],
        [/icebarn/, IcebarnAssist],
        [/aquapelago/, AquapelagoAssist],
        [/nurimaze/, NurimazeAssist],
        [/yinyang/, YinyangAssist],
        [/guidearrow/, GuideArrowAssist],
        [/nurikabe/, NurikabeAssist],
        [/gokigen/, SlantAssist]
    ];

    if (genrelist.filter(g => g[0].test(document.URL)).length === 1) {
        let btn = '<button type="button" class="btn" id="assist" style="display: inline;">Assist</button>';
        let btn2 = '<button type="button" class="btn" id="assiststep" style="display: inline;">Assist Step</button>';
        document.querySelector('#btntrial').insertAdjacentHTML('afterend', btn);
        document.querySelector("#assist").insertAdjacentHTML('afterend', btn2);
        document.querySelector("#assist").addEventListener("click", assist, false);
        document.querySelector("#assiststep").addEventListener("click", assiststep, false);
        window.addEventListener("keypress", (event) => {
            if (event.key === 'q') { assist(); }
            if (event.key === 'w') { assiststep(); }
        });
    }

    function assiststep() {
        step = true;
        assist();
        step = false;
    }

    function assist() {
        flg = true;
        board = ui.puzzle.board;
        for (let loop = 0; loop < (step ? 1 : maxLoop); loop++) {
            if (!flg) { break; }
            flg = false;
            genrelist.filter(g => RegExp('\\\?' + g[0].source + '\\\/').test(document.URL))[0][1]();
        }
        ui.puzzle.redraw();
        console.log('Assisted.');
    }

    let offset = function (c, dx, dy, dir = 0) {
        dir = (dir % 4 + 4) % 4;
        if (dir === 0) { return board.getobj(c.bx + dx * 2, c.by + dy * 2); }
        if (dir === 1) { return board.getobj(c.bx + dy * 2, c.by - dx * 2); }
        if (dir === 2) { return board.getobj(c.bx - dx * 2, c.by - dy * 2); }
        if (dir === 3) { return board.getobj(c.bx - dy * 2, c.by + dx * 2); }
    }
    let fourside = function (a, b) {
        a(b.top);
        a(b.bottom);
        a(b.left);
        a(b.right);
    };
    let fourside2 = function (a, b, c) {
        a(b.top, c.top);
        a(b.bottom, c.bottom);
        a(b.left, c.left);
        a(b.right, c.right);
    };
    let dir = function (c, ndir) {
        ndir = (ndir % 4 + 4) % 4;
        if (ndir === 0) return c.top;
        if (ndir === 1) return c.right;
        if (ndir === 2) return c.bottom;
        if (ndir === 3) return c.left;
    }
    let qdirremap = function (qdir) {
        return [-1, 0, 2, 3, 1][qdir];
    }

    //set val
    let add_cross = function (b) {
        if (b === undefined || b.isnull || b.line || b.qsub !== bqsub.none) { return; }
        if (step && flg) { return; }
        flg = true;
        b.setQsub(bqsub.cross);
        b.draw();
    };
    let add_line = function (b) {
        if (b === undefined || b.isnull || b.line || b.qsub === bqsub.cross) { return; }
        if (step && flg) { return; }
        flg = true;
        b.setLine(1);
        b.draw();
    };
    let add_arrow = function (b, dir) {
        if (b === undefined || b.isnull || b.qsub === bqsub.cross) { return; }
        if (step && flg) { return; }
        flg = true;
        b.setQsub(dir);
        b.draw();
    };
    let add_block = function (c, notOnNum = false) {
        if (notOnNum && c.qnum !== cqnum.none) { return; }
        if (c === undefined || c.isnull || c.lcnt !== 0 || c.qsub === cqsub.dot || c.qans !== cqans.none) { return; }
        if (step && flg) { return; }
        flg = true;
        c.setQans(cqans.block);
        c.draw();
    };
    let add_light = function (c) {
        add_block(c, true);
    };
    let add_dot = function (c) {
        if (c === undefined || c.isnull || c.qnum !== cqnum.none || c.qans !== cqans.none || c.qsub === cqsub.dot) { return; }
        if (step && flg) { return; }
        flg = true;
        c.setQsub(cqsub.dot);
        c.draw();
    };
    let add_green = function (c) {
        if (c === undefined || c.isnull || c.qans !== cqans.none || c.qsub === cqsub.dot) { return; }
        if (step && flg) { return; }
        flg = true;
        c.setQsub(cqsub.green);
        c.draw();
    };

    //single rule
    function No2x2Cell(isBlock, setGreen) {
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            let templist = [cell, offset(cell, 1, 0), offset(cell, 0, 1), offset(cell, 1, 1)];
            if (templist.filter(c => c.isnull).length > 0) { continue; }
            templist = templist.filter(c => !isBlock(c));
            if (templist.length === 1) {
                setGreen(templist[0]);
            }
        }
    }

    function No2x2Block() {
        No2x2Cell(
            function (c) { return c.qans === cqans.block; },
            add_green
        );
    }

    function No2x2Green() {
        No2x2Cell(
            function (c) { return c.qsub === cqsub.green; },
            add_block
        );
    }

    function CellConnected(isBlock, isGreen, setBlock) {
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            if (isBlock(cell) || isGreen(cell)) { continue; }
            let templist = [offset(cell, -1, -1), offset(cell, -1, 0), offset(cell, -1, 1), offset(cell, 0, -1),
            offset(cell, 0, 1), offset(cell, 1, -1), offset(cell, 1, 0), offset(cell, 1, 1)];
            templist = templist.filter(c => !c.isnull && !isGreen(c));
            if (templist.length <= 1 || templist.length >= 7) {
                continue;
            }
            let sparenum = 0;
            let fn = function (c) {
                let dfslist = [];
                let dfs = function (c) {
                    if (dfslist.filter(c => !isBlock(c)).length > maxDfsCellNum) { return; }
                    if (c.isnull || isGreen(c) || dfslist.indexOf(c) !== -1) { return; }
                    dfslist.push(c);
                    if (c === cell) { return; }
                    fourside(dfs, c.adjacent);
                };
                dfs(c);
                if (dfslist.filter(c => !isBlock(c)).length > maxDfsCellNum) {
                    return templist.length;
                }
                if (dfslist.filter(c => isBlock(c)).length === 0 || dfslist.indexOf(cell) === -1) {
                    sparenum++;
                    return templist.length;
                }
                return dfslist.filter(c => templist.indexOf(c) !== -1).length;
            };
            let templist2 = templist.map(c => fn(c));
            if (templist2.filter(n => n + sparenum < templist.length).length > 0) {
                setBlock(cell);
            }
        }
    }

    function CellNoLoop(isBlock, isGreen, setGreen) {
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            if (isBlock(cell) || isGreen(cell)) { continue; }
            let templist = [offset(cell, -1, 0), offset(cell, 0, -1), offset(cell, 0, 1), offset(cell, 1, 0)];
            templist = templist.filter(c => !c.isnull && isBlock(c));
            if (templist.length < 2) { continue; }
            let fn = function (c) {
                let dfslist = [];
                let dfs = function (c) {
                    if (c.isnull || c === cell || !isBlock(c) || dfslist.indexOf(c) !== -1) { return; }
                    dfslist.push(c);
                    fourside(dfs, c.adjacent);
                };
                dfs(c);
                return dfslist.filter(c => templist.indexOf(c) !== -1).length;
            };
            let templist2 = templist.map(c => fn(c));
            if (templist2.filter(n => n > 1).length > 0) {
                setGreen(cell);
            }
        }
    }

    function GreenConnectedInCell() {
        CellConnected(
            function (c) { return c.qsub === cqsub.green; },
            function (c) { return c.qans === cqans.block; },
            add_green
        );
    }

    function BlockConnectedInCell() {
        CellConnected(
            function (c) { return c.qans === cqans.block; },
            function (c) { return c.qsub === cqsub.green; },
            add_block
        );
    }

    function GreenNoLoopInCell() {
        CellNoLoop(
            function (c) { return c.qsub === cqsub.green; },
            function (c) { return c.qans === cqans.block; },
            add_block
        );
    }

    function BlockNotAdjacent() {
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            if (cell.qans !== cqans.block) { continue; }
            fourside(add_green, cell.adjacent);
        }
    }

    function SingleLoopInCell(inPath) {
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            if (cell.ques === cques.block) { continue; }
            let emptynum = 0;
            let linenum = 0;
            let adjcell = cell.adjacent;
            let adjline = cell.adjborder;
            let fn = function (c, b) {
                if (!c.isnull && b.qsub !== bqsub.cross) { emptynum++; }
                linenum += b.line;
            };
            fourside2(fn, adjcell, adjline);
            //no branch
            if (linenum === 2 && cell.ques !== cques.ice) {
                fourside(add_cross, adjline);
            }
            //no deadend
            if (emptynum === 1) {
                fourside(add_cross, adjline);
            }
            //2 degree path
            if (emptynum === 2 && (linenum === 1 || cell.qsub === cqsub.dot || inPath)) {
                fourside(add_line, adjline);
            }
        }
        //avoid forming multiple loop
        for (let i = 0; i < board.border.length; i++) {
            let border = board.border[i];
            if (border.qsub !== bqsub.none || border.line) { continue; }
            let cr1 = border.sidecell[0];
            let cr2 = border.sidecell[1];
            if (cr1.ques === cques.ice || cr2.ques === cques.ice) { continue; }
            if (cr1.path !== null && cr1.path === cr2.path && board.linegraph.components.length > 1) {
                add_cross(border);
            }
        }
    }

    function NumberRegion(isBlock, isGreen, setBlock, setGreen, OneNumPerRegion = true) {
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            //don't block region exit
            let blocknum = 0;
            let templist = [offset(cell, -1, -1), offset(cell, -1, 0), offset(cell, -1, 1), offset(cell, 0, -1),
            offset(cell, 0, 1), offset(cell, 1, -1), offset(cell, 1, 0), offset(cell, 1, 1)];
            if (!isBlock(cell) && !isGreen(cell) && templist.filter(c => isGreen(c) || c.isnull).length >= 2) {
                for (let d = 0; d < 4; d++) {
                    let ncell = dir(cell.adjacent, d);
                    if (isGreen(ncell)) { continue; }
                    let cellList = [];
                    let dfs = function (c) {
                        if (cellList.length > maxDfsCellNum) { return; }
                        if (c.isnull || isGreen(c) || c === cell || cellList.indexOf(c) !== -1) { return; }
                        cellList.push(c);
                        fourside(dfs, c.adjacent);
                    }
                    dfs(ncell);
                    if (cellList.length > maxDfsCellNum) { continue; }
                    let templist = cellList.filter(c => c.qnum !== cqnum.none);
                    if (templist.length === 0 && cellList.filter(c => isBlock(c)).length > 0) {
                        setBlock(cell);
                    }
                    if (templist.length === 1 && templist[0].qnum !== cqnum.quesmark && templist[0].qnum > cellList.length) {
                        setBlock(cell);
                    }
                }
            }
            //finished region
            if (cell.qnum > 0) {
                let cellList = [];
                let dfs = function (c) {
                    if (cellList.length > cell.qnum) { return; }
                    if (c.isnull || !isBlock(c) || cellList.indexOf(c) !== -1) { return; }
                    cellList.push(c);
                    fourside(dfs, c.adjacent);
                }
                dfs(cell);
                if (cellList.length === cell.qnum) {
                    cellList.forEach(c => fourside(setGreen, c.adjacent));
                }
            }
            //finished surrounded region
            if (cell.qnum > 0) {
                let cellList = [];
                let dfs = function (c) {
                    if (cellList.length > cell.qnum) { return; }
                    if (c.isnull || isGreen(c) || cellList.indexOf(c) !== -1) { return; }
                    cellList.push(c);
                    fourside(dfs, c.adjacent);
                }
                dfs(cell);
                let templist = cellList.filter(c => c.qnum !== cqnum.none);
                if (templist.length === 1 && cell.qnum !== cqnum.quesmark && cell.qnum === cellList.length) {
                    cellList.forEach(c => setBlock(c));
                }
            }
            //not connect two region
            for (let d1 = 0; d1 < 4; d1++) {
                for (let d2 = d1 + 1; d2 < 4; d2++) {
                    if (isBlock(cell) || isGreen(cell)) { continue; }
                    let cell1 = dir(cell.adjacent, d1);
                    let cell2 = dir(cell.adjacent, d2);
                    if (cell1.isnull || cell2.isnull || !isBlock(cell1) || !isBlock(cell2)) { continue; }
                    let cellList1 = [];
                    let cellList2 = [];
                    let dfs = function (c, list) {
                        if (c.isnull || !isBlock(c) || list.indexOf(c) !== -1) { return; }
                        list.push(c);
                        dfs(c.adjacent.top, list);
                        dfs(c.adjacent.bottom, list);
                        dfs(c.adjacent.left, list);
                        dfs(c.adjacent.right, list);
                    }
                    dfs(cell1, cellList1);
                    dfs(cell2, cellList2);
                    if (cellList1.indexOf(cell2) !== -1) { continue; }
                    let templist1 = cellList1.filter(c => c.qnum !== cqnum.none);
                    let templist2 = cellList2.filter(c => c.qnum !== cqnum.none);
                    if (templist1.length === 1 && templist2.length === 1) {
                        if (templist1[0].qnum !== cqnum.quesmark && templist2[0].qnum !== cqnum.quesmark && templist1[0].qnum !== templist2[0].qnum || OneNumPerRegion) {
                            setGreen(cell);
                        }
                    }
                    if (templist1.length + templist2.length === 1) {
                        let qnum = (templist1.length === 1 ? templist1[0] : templist2[0]).qnum;
                        if (qnum !== cqnum.quesmark && cellList1.length + cellList2.length + 1 > qnum) {
                            setGreen(cell);
                        }
                    }
                }
            }
        }
    }

    //assist for certain genre
    function SlantAssist() {
        let add_slash = function (c, qans) {
            if (c === undefined || c.isnull || c.qans !== cqans.none) { return; }
            if (step && flg) { return; }
            flg = true;
            c.setQans(qans % 2 === 0 ? cqans.lslash : cqans.rslash);
            c.draw();
        };
        let isNotSide = function (c) {
            return c.bx > board.minbx && c.bx < board.maxbx && c.by > board.minby && c.by < board.maxby;
        }
        for (let i = 0; i < board.cross.length; i++) {
            let cross = board.cross[i];
            let adjcellList = [[board.getc(cross.bx - 1, cross.by - 1), cqans.rslash, cqans.lslash],
            [board.getc(cross.bx - 1, cross.by + 1), cqans.lslash, cqans.rslash],
            [board.getc(cross.bx + 1, cross.by - 1), cqans.lslash, cqans.rslash],
            [board.getc(cross.bx + 1, cross.by + 1), cqans.rslash, cqans.lslash]];
            adjcellList = adjcellList.filter(c => !c[0].isnull);
            //finish clue
            if (cross.qnum >= 0) {
                if (adjcellList.filter(c => c[0].qans === c[1]).length === cross.qnum) {
                    adjcellList.forEach(c => add_slash(c[0], c[2]));
                }
                if (adjcellList.filter(c => c[0].qans !== c[2]).length === cross.qnum) {
                    adjcellList.forEach(c => add_slash(c[0], c[1]));
                }
            }
            //diagonal 1 & 1
            if (cross.qnum === 1 && isNotSide(cross)) {
                for (let d = 0; d < 4; d++) {
                    let cross2 = offset(cross, 1, 1, d);
                    if (cross2.qnum === 1 && isNotSide(cross2)) {
                        add_slash(offset(cross, .5, .5, d), cqans.lslash + d);
                    }
                }
            }
            //1 & 1
            if (cross.qnum === 1) {
                for (let d = 0; d < 4; d++) {
                    if (offset(cross, 0, 1, d).isnull || offset(cross, 0, -1, d).isnull) { continue; }
                    if (!offset(cross, 1, 0, d).isnull && offset(cross, 1, 0, d).qnum === 1) {
                        add_slash(offset(cross, -0.5, -.5, d), cqans.lslash + d);
                        add_slash(offset(cross, -0.5, +.5, d), cqans.rslash + d);
                        add_slash(offset(cross, +1.5, -.5, d), cqans.rslash + d);
                        add_slash(offset(cross, +1.5, +.5, d), cqans.lslash + d);
                    }
                }
            }
            //3 & 3
            if (cross.qnum === 3) {
                for (let d = 0; d < 4; d++) {
                    if (!offset(cross, 1, 0, d).isnull && offset(cross, 1, 0, d).qnum === 3 && isNotSide(offset(cross, 1, 0, d))) {
                        add_slash(offset(cross, -0.5, -.5, d), cqans.rslash + d);
                        add_slash(offset(cross, -0.5, +.5, d), cqans.lslash + d);
                        add_slash(offset(cross, +1.5, -.5, d), cqans.lslash + d);
                        add_slash(offset(cross, +1.5, +.5, d), cqans.rslash + d);
                    }
                }
            }
        }
        //no loop
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            if (cell.qans !== cqans.none) { continue; }
            let cross1, cross2;
            cross1 = board.getobj(cell.bx - 1, cell.by - 1);
            cross2 = board.getobj(cell.bx + 1, cell.by + 1);
            if (cross1.path !== null && cross1.path === cross2.path) {
                add_slash(cell, cqans.lslash);
            }
            cross1 = board.getobj(cell.bx - 1, cell.by + 1);
            cross2 = board.getobj(cell.bx + 1, cell.by - 1);
            if (cross1.path !== null && cross1.path === cross2.path) {
                add_slash(cell, cqans.rslash);
            }
        }
    }

    function NurikabeAssist() {
        for (let i = 0; i < board.cell.length; i++) {
            //add dot on num
            let cell = board.cell[i];
            if (cell.qnum !== cqnum.none) {
                add_green(cell);
            }
            //surrounded white cell
            let templist = [offset(cell, 1, 0, 0), offset(cell, 1, 0, 1), offset(cell, 1, 0, 2), offset(cell, 1, 0, 3)];
            if (cell.qnum === cqnum.none && templist.filter(c => c.isnull || c.qans === cqans.block).length === 4) {
                add_block(cell);
            }
        }
        BlockConnectedInCell();
        No2x2Block();
        NumberRegion(
            function (c) { return c.qsub === cqsub.dot; },
            function (c) { return c.qans === cqans.block; },
            add_green,
            add_block
        );
        //remove the dot on num because it looks weird
        if (!step) {
            for (let i = 0; i < board.cell.length; i++) {
                let cell = board.cell[i];
                if (cell.qnum !== cqnum.none) {
                    cell.setQsub(cqsub.none);
                    cell.draw();
                }
            }
        }
    }

    function GuideArrowAssist() {
        BlockNotAdjacent();
        GreenConnectedInCell();
        GreenNoLoopInCell();
        let goalcell = board.getc(board.goalpos.bx, board.goalpos.by);
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            if (cell === goalcell) {
                add_green(cell);
                continue;
            }
            if (cell.qnum !== cqnum.none) {
                add_green(cell);
                if (cell.qnum !== cqnum.quesmark) {
                    let d = qdirremap(cell.qnum);
                    add_green(dir(cell.adjacent, d));
                }
                continue;
            }
        }
    }

    function YinyangAssist() {
        let add_color = function (c, color) {
            if (c === undefined || c.isnull || c.anum !== canum.none || color !== canum.wcir && color !== canum.bcir) { return; }
            if (step && flg) { return; }
            flg = true;
            c.setAnum(color);
            c.draw();
        };
        let add_black = function (c) {
            add_color(c, canum.bcir);
        };
        let add_white = function (c) {
            add_color(c, canum.wcir);
        };
        CellConnected(
            function (c) { return c.anum === canum.wcir; },
            function (c) { return c.anum === canum.bcir; },
            add_white
        );
        CellConnected(
            function (c) { return c.anum === canum.bcir; },
            function (c) { return c.anum === canum.wcir; },
            add_black
        );
        No2x2Cell(
            function (c) { return c.anum === canum.wcir; },
            add_black
        );
        No2x2Cell(
            function (c) { return c.anum === canum.bcir; },
            add_white
        );
        //cell at side is grouped when both sides are even
        if (board.rows % 2 === 0 && board.cols % 2 === 0) {
            for (let i = 1; i + 1 < board.rows; i += 2) {
                let cell1 = board.getc(board.minbx + 1, 2 * i + 1);
                let cell2 = board.getc(board.minbx + 1, 2 * i + 3);
                if (cell1.anum !== canum.none || cell2.anum !== canum.none) {
                    add_color(cell1, cell2.anum);
                    add_color(cell2, cell1.anum);
                }
                cell1 = board.getc(board.maxbx - 1, 2 * i + 1);
                cell2 = board.getc(board.maxbx - 1, 2 * i + 3);
                if (cell1.anum !== canum.none || cell2.anum !== canum.none) {
                    add_color(cell1, cell2.anum);
                    add_color(cell2, cell1.anum);
                }
            }
            for (let i = 1; i + 1 < board.cols; i += 2) {
                let cell1 = board.getc(2 * i + 1, board.minby + 1);
                let cell2 = board.getc(2 * i + 3, board.minby + 1);
                if (cell1.anum !== canum.none || cell2.anum !== canum.none) {
                    add_color(cell1, cell2.anum);
                    add_color(cell2, cell1.anum);
                }
                cell1 = board.getc(2 * i + 1, board.maxby - 1);
                cell2 = board.getc(2 * i + 3, board.maxby - 1);
                if (cell1.anum !== canum.none || cell2.anum !== canum.none) {
                    add_color(cell1, cell2.anum);
                    add_color(cell2, cell1.anum);
                }
            }
        }
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            if (cell.qnum !== cqnum.none) {
                add_color(cell, cell.qnum);
            }
            //WbB
            //W.W
            if (cell.anum === canum.none) {
                for (let d = 0; d < 4; d++) {
                    let templist = [offset(cell, 1, -1, d), offset(cell, 1, 1, d), offset(cell, 0, -1, d), offset(cell, 0, 1, d)];
                    if (templist.filter(c => c.isnull || c.anum === canum.none).length === 0 &&
                        templist[0].anum === templist[1].anum && templist[2].anum !== templist[3].anum) {
                        add_color(cell, canum.bcir + canum.wcir - templist[0].anum);
                    }
                }
            }
            //checker pattern
            if (cell.anum === canum.none) {
                let fn = function (c, c1, c2, c12) {
                    if (c1.isnull || c2.isnull || c12.isnull) { return; }
                    if (c1.anum === canum.none || c2.anum === canum.none || c12.anum === canum.none) { return; }
                    if (c1.anum === c2.anum && c1.anum !== c12.anum) {
                        add_color(c, c1.anum);
                    }
                };
                for (let d = 0; d < 4; d++) {
                    fn(cell, offset(cell, 1, 0, d), offset(cell, 0, 1, d), offset(cell, 1, 1, d));
                }
            }
        }
        //outside
        {
            let firstcell = board.cell[0];
            let cellList = [];
            for (let j = 0; j < board.rows; j++) { cellList.push(offset(firstcell, 0, j)); }
            for (let i = 1; i < board.cols - 1; i++) { cellList.push(offset(firstcell, i, board.rows - 1)); }
            for (let j = board.rows - 1; j >= 0; j--) { cellList.push(offset(firstcell, board.cols - 1, j)); }
            for (let i = board.cols - 2; i > 0; i--) { cellList.push(offset(firstcell, i, 0)); }
            let len = cellList.length;
            if (cellList.filter(c => c.anum === canum.bcir).length > 0 && cellList.filter(c => c.anum === canum.wcir).length > 0) {
                for (let i = 0; i < len; i++) {
                    if (cellList[i].anum === canum.none || cellList[(i + 1) % len].anum !== canum.none) { continue; }
                    for (let j = (i + 1) % len; j != i; j = (j + 1) % len) {
                        if (cellList[j].anum === canum.bcir + canum.wcir - cellList[i].anum) { break; }
                        if (cellList[j].anum === canum.none) { continue; }
                        if (cellList[j].anum === cellList[i].anum) {
                            for (let k = i; k != j; k = (k + 1) % len) {
                                add_color(cellList[k], cellList[i].anum);
                            }
                        }
                    }
                }
            }
        }
    }

    function NurimazeAssist() {
        No2x2Block();
        No2x2Green();
        GreenConnectedInCell();
        CellConnected(
            function (c) {
                let startcell = board.getc(board.startpos.bx, board.startpos.by);
                let goalcell = board.getc(board.goalpos.bx, board.goalpos.by);
                return c === startcell || c === goalcell || c.qans === cques.cir;
            },
            function (c) { return c.qans === cqans.block || c.ques === cques.tri },
            add_green
        );
        let startcell = board.getc(board.startpos.bx, board.startpos.by);
        let goalcell = board.getc(board.goalpos.bx, board.goalpos.by);
        for (let i = 0; i < board.roommgr.components.length; i++) {
            let room = board.roommgr.components[i];
            let cellList = [];
            for (let j = 0; j < room.clist.length; j++) {
                cellList.push(room.clist[j]);
            }
            if (cellList.filter(c => c.qsub === cqsub.green || c.ques === cques.cir || c.ques === cques.tri).length > 0 ||
                room === startcell.room || room === goalcell.room) {
                cellList.forEach(c => add_green(c));
                continue;
            }
            if (cellList.filter(c => c.qans === cqans.block).length > 0) {
                cellList.forEach(c => add_block(c));
                continue;
            }
            //no loop
            let templist = [];
            cellList.forEach(c => {
                let fn = function (c) {
                    if (c.isnull || templist.indexOf(c) !== -1) { return; }
                    templist.push(c);
                }
                let list = [offset(c, -1, 0), offset(c, 0, -1), offset(c, 0, 1), offset(c, 1, 0)];
                list.forEach(c => fn(c));
            });
            templist = templist.filter(c => !c.isnull && c.qsub === cqsub.green);
            if (templist.length < 2) { continue; }
            let fn1 = function (c) {
                let dfslist = [];
                let dfs = function (c) {
                    if (c.isnull || c.qsub !== cqsub.green || dfslist.indexOf(c) !== -1) { return; }
                    dfslist.push(c);
                    fourside(dfs, c.adjacent);
                };
                dfs(c);
                return dfslist.filter(c => templist.indexOf(c) !== -1).length;
            };
            let templist2 = templist.map(c => fn1(c));
            if (templist2.filter(n => n > 1).length > 0) {
                cellList.forEach(c => add_block(c));
                continue;
            }
            //no branch
            let fn2 = function (c) {
                let res = 0;
                let dfslist = [];
                let dfs = function (c) {
                    if (c.isnull || c.qsub !== cqsub.green || dfslist.indexOf(c) !== -1) { return; }
                    if (c === startcell || c === goalcell || c.ques === cques.cir || c.lcnt > 0) {
                        res += c === startcell;
                        res += c === goalcell;
                        res += (c.ques === cques.cir && c.lcnt === 0);
                        res += c.lcnt;
                        res += (dfslist.filter(c => c.ques === cques.tri).length > 0 ? 2 : 0);
                        return;
                    }
                    dfslist.push(c);
                    fourside(dfs, c.adjacent);
                    dfslist.pop();
                }
                dfs(c);
                return Math.min(res, 2);
            }
            templist2 = templist.map(c => fn2(c));
            if (templist2.reduce(function (a, b) { return a + b; }) > 2) {
                cellList.forEach(c => add_block(c));
            }
        }
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            if (cell.ques === cques.cir) {
                let templist = [offset(cell, -1, 0), offset(cell, 1, 0), offset(cell, 0, -1), offset(cell, 0, 1)];
                templist = templist.filter(c => !c.isnull && c.qans !== cqans.block);
                if (templist.length === 2) {
                    templist.forEach(c => add_green(c));
                }
            }
            //surrounded by block
            {
                let templist = [offset(cell, 1, 0, 0), offset(cell, 1, 0, 1), offset(cell, 1, 0, 2), offset(cell, 1, 0, 3)];
                if (templist.filter(c => c.isnull || c.qans === cqans.block).length === 4) {
                    add_block(cell);
                }
            }
            //no 2*2
            {
                let templist = [cell, offset(cell, 1, 0), offset(cell, 0, 1), offset(cell, 1, 1)];
                if (templist.filter(c => c.isnull).length == 0 && templist.filter(c => c.qsub === cqsub.green).length === 0) {
                    let templist2 = templist.filter(c => !c.qans);
                    if (templist2.length > 0 && templist2.filter(c => c.room !== templist2[0].room).length === 0) {
                        add_green(templist2[0]);
                    }
                }
                if (templist.filter(c => c.qans).length === 0) {
                    let templist2 = templist.filter(c => c.qsub !== cqsub.green);
                    if (templist2.length > 0 && templist2.filter(c => c.room !== templist2[0].room).length === 0) {
                        add_block(templist2[0]);
                    }
                }
            }
        }
        //line
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            let adjcell = cell.adjacent;
            let adjline = cell.adjborder;
            if (cell.qans === cqans.block || cell.ques === cques.tri) {
                fourside(add_cross, adjline);
            }
            if (cell.qans !== cqans.block) {
                let emptynum = 0;
                let linenum = 0;
                let fn = function (c, b) {
                    if (!c.isnull && b.qsub !== bqsub.cross) { emptynum++; }
                    linenum += b.line;
                };
                fourside2(fn, adjcell, adjline);
                if (linenum > 0) {
                    add_green(cell);
                }
                //no branch
                if (linenum === 2 || linenum === 1 && (cell === startcell || cell === goalcell)) {
                    fourside(add_cross, adjline);
                }
                //no deadend
                if (emptynum === 1) {
                    if (cell !== startcell && cell !== goalcell) {
                        fourside(add_cross, adjline);
                    } else {
                        let fn = function (c, b) {
                            if (!c.isnull && b.qsub !== bqsub.cross) {
                                add_line(b);
                            }
                        }
                        fourside2(fn, adjcell, adjline);
                    }
                }
                //2 degree path
                if (emptynum === 2 && cell !== startcell && cell !== goalcell && (linenum === 1 || cell.ques === cques.cir)) {
                    let fn = function (c, b) {
                        add_line(b);
                        if (!b.isnull && b.line) {
                            add_green(c);
                        }
                    };
                    fourside2(fn, adjcell, adjline);
                }
                //extend line
                emptynum = 0;
                linenum = 0;
                fourside2(fn, adjcell, adjline);
                if (linenum === 1 && cell !== startcell && cell !== goalcell ||
                    linenum === 0 && (cell === startcell || cell === goalcell || cell.ques == cques.cir)) {
                    let fn = function (c, b, list) {
                        if (c.isnull || c.qsub !== cqsub.green || list.indexOf(c) !== -1) { return; }
                        if (b !== null && b.line) { return; }
                        list.push(c);
                        if (c.lcnt === 1 || c.ques === cques.cir || c === startcell || c === goalcell) {
                            for (let j = 1; j < list.length; j++) {
                                let cell1 = list[j - 1];
                                let cell2 = list[j];
                                let border = board.getb((cell1.bx + cell2.bx) / 2, (cell1.by + cell2.by) / 2);
                                add_line(border);
                                add_green(cell1);
                                add_green(cell2);
                            }
                        }
                        fn(c.adjacent.top, c.adjborder.top, list);
                        fn(c.adjacent.bottom, c.adjborder.bottom, list);
                        fn(c.adjacent.left, c.adjborder.left, list);
                        fn(c.adjacent.right, c.adjborder.right, list);
                        list.pop();
                    }
                    fn(cell, null, []);
                }
            }
        }
    }

    function AquapelagoAssist() {
        No2x2Green();
        BlockNotAdjacent();
        GreenConnectedInCell();
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            if (cell.qnum !== cqnum.none) {
                add_block(cell);
            }
            if (cell.qnum > 0) {
                let templist = [];
                let fn = function (c) {
                    if (c.qans !== cqans.block) { return; }
                    if (templist.indexOf(c) !== -1) { return; }
                    templist.push(c);
                    fn(offset(c, -1, -1));
                    fn(offset(c, -1, +1));
                    fn(offset(c, +1, -1));
                    fn(offset(c, +1, +1));
                }
                fn(cell);
                if (templist.length === cell.qnum) {
                    templist.forEach(c => {
                        add_green(offset(c, -1, -1));
                        add_green(offset(c, -1, +1));
                        add_green(offset(c, +1, -1));
                        add_green(offset(c, +1, +1));
                    });
                }
            }
        }
    }

    function IcebarnAssist() {
        SingleLoopInCell();
        //add cross outside except IN and OUT
        {
            let inp = [board.arrowin.bx, board.arrowin.by];
            let outp = [board.arrowout.bx, board.arrowout.by];
            add_line(board.getb(inp[0], inp[1]));
            add_line(board.getb(outp[0], outp[1]));
            let minbx = board.minbx + 2;
            let minby = board.minby + 2;
            let maxbx = board.maxbx - 2;
            let maxby = board.maxby - 2;
            for (let j = minbx + 1; j < maxbx; j += 2) {
                add_cross(board.getb(j, minby));
                add_cross(board.getb(j, maxby));
            }
            for (let j = minby + 1; j < maxby; j += 2) {
                add_cross(board.getb(minbx, j));
                add_cross(board.getb(maxbx, j));
            }
        }
        for (let i = 0; i < board.border.length; i++) {
            let border = board.border[i];
            if (border.qdir != qdir.none) {
                add_arrow(border, border.qdir + 10);   //from qdir to bqsub
                add_line(border);
            }
        }
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            let adjline = cell.adjborder;
            if (cell.ques === cques.ice) {
                for (let d = 0; d < 4; d++) {
                    if (dir(adjline, d).qsub === bqsub.cross) {
                        add_cross(dir(adjline, d + 2));
                    }
                    if (dir(adjline, d).line) {
                        add_line(dir(adjline, d + 2));
                        if (dir(adjline, d).qsub !== bqsub.none) {
                            add_arrow(dir(adjline, d + 2), dir(adjline, d).qsub);
                        }
                    }
                }
            }
            if (cell.lcnt === 2 && cell.ques !== cques.ice) {
                let templist = [[adjline.top, bqsub.arrow_up, bqsub.arrow_dn], [adjline.bottom, bqsub.arrow_dn, bqsub.arrow_up],
                [adjline.left, bqsub.arrow_lt, bqsub.arrow_rt], [adjline.right, bqsub.arrow_rt, bqsub.arrow_lt]];
                templist = templist.filter(b => b[0].line);
                if (templist.filter(b => b[0].qsub === bqsub.none).length === 1) {
                    if (templist[0][0].qsub !== bqsub.none) {
                        templist = [templist[1], templist[0]];
                    }
                    if (templist[1][0].qsub === templist[1][1]) {
                        add_arrow(templist[0][0], templist[0][2]);
                    }
                    if (templist[1][0].qsub === templist[1][2]) {
                        add_arrow(templist[0][0], templist[0][1]);
                    }
                }
            }
            if (cell.lcnt === 1 && cell.ques !== cques.ice) {
                for (let d = 0; d < 4; d++) {
                    let ncell = dir(cell.adjacent, d);
                    while (!ncell.isnull && ncell.ques === cques.ice) {
                        ncell = dir(ncell.adjacent, d);
                    }
                    if (ncell.isnull || ncell.lcnt !== 1 || dir(ncell.adjborder, d + 2).line) { continue; }
                    let fn = function (c) {
                        let adjline = c.adjborder;
                        let templist = [[adjline.top, bqsub.arrow_up, bqsub.arrow_dn], [adjline.bottom, bqsub.arrow_dn, bqsub.arrow_up],
                        [adjline.left, bqsub.arrow_lt, bqsub.arrow_rt], [adjline.right, bqsub.arrow_rt, bqsub.arrow_lt]];
                        templist = templist.filter(b => b[0].line);
                        if (templist.length !== 1) { return 0; }
                        if (templist[0][0].qsub === templist[0][1]) { return 1; }
                        if (templist[0][0].qsub === templist[0][2]) { return 2; }
                        return 0;
                    }
                    if (fn(cell) && fn(cell) === fn(ncell)) {
                        add_cross(dir(adjline, d));
                    }
                }
            }
        }
    }

    function LitsAssist() {
        No2x2Block();
        for (let i = 0; i < board.roommgr.components.length; i++) {
            let room = board.roommgr.components[i];
            let templist = [];
            for (let j = 0; j < room.clist.length; j++) {
                templist.push(room.clist[j]);
            }
            if (templist.filter(c => c.qsub !== cqsub.dot).length === 4) {
                templist.forEach(c => add_block(c));
            }
            if (templist.filter(c => c.qans === cqans.block).length === 4) {
                templist.forEach(c => add_dot(c));
            }
            for (let j = 0; j < room.clist.length; j++) {
                if (room.clist[j].qsub === cqsub.dot) { continue; }
                let templist2 = [];
                let fn = function (c) {
                    if (c.room !== room || c.qsub === cqsub.dot || templist2.indexOf(c) !== -1) { return; }
                    templist2.push(c);
                    fourside(fn, c.adjacent);
                }
                fn(room.clist[j]);
                if (templist2.length < 4) {
                    templist2.forEach(c => add_dot(c));
                }
                if (room.clist[j].qans !== cqans.block) { continue; }
                templist2 = [];
                fn = function (c, step = 3) {
                    if (step < 0 || c.room !== room) { return; }
                    templist2.push(c);
                    fn(c.adjacent.top, step - 1);
                    fn(c.adjacent.bottom, step - 1);
                    fn(c.adjacent.left, step - 1);
                    fn(c.adjacent.right, step - 1);
                }
                fn(room.clist[j]);
                templist.forEach(c => {
                    if (templist2.indexOf(c) === -1) {
                        add_dot(c);
                    }
                });
            }
        }
    }

    function NothreeAssist() {
        BlockNotAdjacent();
        GreenConnectedInCell();
        for (let i = 0; i < board.dots.length; i++) {
            let dot = board.dots[i].piece;
            if (dot.qnum !== 1) { continue; }
            let cellList = [];
            if (dot.bx % 2 === 1 && dot.by % 2 === 1) {
                cellList.push(board.getc(dot.bx, dot.by));
            }
            if (dot.bx % 2 === 0 && dot.by % 2 === 1) {
                cellList.push(board.getc(dot.bx - 1, dot.by));
                cellList.push(board.getc(dot.bx + 1, dot.by));
            }
            if (dot.bx % 2 === 1 && dot.by % 2 === 0) {
                cellList.push(board.getc(dot.bx, dot.by - 1));
                cellList.push(board.getc(dot.bx, dot.by + 1));
            }
            if (dot.bx % 2 === 0 && dot.by % 2 === 0) {
                cellList.push(board.getc(dot.bx - 1, dot.by - 1));
                cellList.push(board.getc(dot.bx + 1, dot.by - 1));
                cellList.push(board.getc(dot.bx - 1, dot.by + 1));
                cellList.push(board.getc(dot.bx + 1, dot.by + 1));
            }
            let blocknum = 0;
            let emptynum = 0;
            cellList.forEach(c => {
                blocknum += c.qans === cqans.block;
                emptynum += c.qans !== cqans.block && c.qsub !== cqsub.dot;
            });
            if (blocknum === 0 && emptynum === 1) {
                cellList.forEach(c => add_block(c));
            }
            if (blocknum === 1) {
                cellList.forEach(c => add_green(c));
            }
        }
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            for (let d = 0; d < 4; d++) {
                let fn = function (list) {
                    if (list.filter(c => c.isnull).length === 0 && list.filter(c => c.qans === cqans.block).length === 2) {
                        list.forEach(c => add_green(c));
                    }
                }
                //O.O.O
                fn([cell, offset(cell, 2, 0, d), offset(cell, 4, 0, d)]);
                //O..O..O
                fn([cell, offset(cell, 3, 0, d), offset(cell, 6, 0, d)]);
                //O...O...O
                fn([cell, offset(cell, 4, 0, d), offset(cell, 8, 0, d)]);
                //OXXXXOX?XXO
                for (let l = 5; l * 2 < Math.min(board.cols, board.rows); l++) {
                    let templist1 = [cell, offset(cell, l, 0, d), offset(cell, 2 * l, 0, d)];
                    if (templist1.filter(c => c.isnull).length > 0) { continue; }
                    templist1 = templist1.filter(c => c.qans !== cqans.block);
                    let templist2 = [];
                    for (let j = 1; j < 2 * l; j++) {
                        if (j === l) { continue; }
                        templist2.push(offset(cell, j, 0, d));
                    }
                    if (templist2.filter(c => c.qans === cqans.block).length > 0) { continue; }
                    templist2 = templist2.filter(c => c.qsub !== cqsub.dot);
                    if (templist1.length === 0 && templist2.length === 1) {
                        add_block(templist2[0]);
                    }
                    if (templist1.length === 1 && templist2.length === 0) {
                        add_green(templist1[0]);
                    }
                }
            }
        }
    }

    function EkawayehAssist() {
        HeyawakeAssist();
        for (let i = 0; i < board.roommgr.components.length; i++) {
            let room = board.roommgr.components[i];
            let qnum = room.top.qnum;
            let rows = room.clist.getRectSize().rows;
            let cols = room.clist.getRectSize().cols;
            let tx = room.clist.getRectSize().x1 + room.clist.getRectSize().x2;
            let ty = room.clist.getRectSize().y1 + room.clist.getRectSize().y2;
            if (rows % 2 === 1 && cols % 2 === 0) {
                add_green(board.getc(tx / 2 - 1, ty / 2));
                add_green(board.getc(tx / 2 + 1, ty / 2));
            }
            if (rows % 2 === 0 && cols % 2 === 1) {
                add_green(board.getc(tx / 2, ty / 2 - 1));
                add_green(board.getc(tx / 2, ty / 2 + 1));
            }
            if (rows % 2 === 1 && cols % 2 === 1) {
                if (qnum >= 0 && qnum % 2 === 0) {
                    add_green(board.getc(tx / 2, ty / 2));
                }
                if (qnum >= 0 && qnum % 2 === 1) {
                    add_block(board.getc(tx / 2, ty / 2));
                }
            }
            for (let j = 0; j < room.clist.length; j++) {
                let cell = room.clist[j];
                if (cell.qsub === cqsub.green) {
                    add_green(board.getc(tx - cell.bx, ty - cell.by));
                }
                if (cell.qans === cqans.block) {
                    add_block(board.getc(tx - cell.bx, ty - cell.by));
                }
            }
        }
    }

    function ShakashakaAssist() {
        let isEmpty = function (c) {
            return !c.isnull && c.qnum === cqnum.none && c.qsub === cqsub.none && c.qans === cqans.none;
        };
        //draw triangle
        let add_triangle = function (c, ndir) { //0 = bl, 1 = br, 2 = tr, 3 = tl
            if (c === undefined || c.isnull || !isEmpty(c)) { return; }
            if (step && flg) { return; }
            flg = true;
            ndir = (ndir % 4 + 4) % 4;
            c.setQans(ndir + 2);
            c.draw();
        };
        //check blocking edge
        let isEdge = function (c, ndir) { //0 = left, 1 = bottom, 2 = right, 3 = top
            ndir = (ndir % 4 + 4) % 4;
            let tdir = (ndir + 3) % 4;
            return c.isnull || c.qnum !== cqnum.none || c.qans === tdir + 2 || c.qans === ndir + 2;
        };
        //check dot area if stick edge
        let isDotEdge = function (c) {
            if (c.qsub !== cqsub.dot) { return false; }
            let temp = false;
            let dfslist = [c];
            let dfs = function (c, ndir) {
                if (isEmpty(c) || dfslist.indexOf(c) !== -1) { return; }
                if (isEdge(c, ndir + 2)) { temp = true; return; }
                if (c.qsub === cqsub.dot) {
                    dfslist.push(c);
                    dfs(offset(c, -1, 0), 0);
                    dfs(offset(c, 0, 1), 1);
                    dfs(offset(c, 1, 0), 2);
                    dfs(offset(c, 0, -1), 3);
                }
            };
            for (let d = 0; d < 4; d++) {
                dfs(dir(c.adjacent, 3 - d), d);
            }
            return temp;
        };
        //check blocking edge including dot
        let isEdgeEx = function (c, ndir) { //0 = left, 1 = bottom, 2 = right, 3 = top
            return isEdge(c, ndir) || isDotEdge(c);
        };
        //check blocking corner including dot
        let isCorner = function (c, ndir) { //0 = bl, 1 = br, 2 = tr, 3 = tl
            ndir = (ndir % 4 + 4) % 4;
            return c.isnull || c.qnum !== cqnum.none || c.qans === ndir + 2 || isDotEdge(c);
        };
        //check blocking sharp including dot
        let isSharp = function (c, ndir) { //0 = bl, 1 = br, 2 = tr, 3 = tl
            ndir = (ndir % 4 + 4) % 4;
            return isEdgeEx(c, ndir) || c.qans === (ndir + 1) % 4 + 2;
        };
        //if can place triangle of specific direction
        let isntTri = function (c, ndir) { //0 = bl, 1 = br, 2 = tr, 3 = tl
            ndir = (ndir % 4 + 4) % 4;
            if (!isEmpty(c) && c.qans !== ndir + 2) { return true; }
            if (c.qans === ndir + 2) { return false; }
            let temp = offset(c, 1, 0, ndir);
            if (isEdgeEx(temp, ndir) || temp.qans === (ndir + 2) % 4 + 2) { return true; }
            temp = offset(c, 0, -1, ndir);
            if (isEdgeEx(temp, ndir + 1) || temp.qans === (ndir + 2) % 4 + 2) { return true; }
            temp = offset(c, -1, 0, ndir);
            if (!temp.isnull && (temp.qans === (ndir + 3) % 4 + 2 || temp.qans === ndir + 2)) { return true; }
            temp = offset(c, 0, 1, ndir);
            if (!temp.isnull && (temp.qans === ndir + 2 || temp.qans === (ndir + 1) % 4 + 2)) { return true; }
            temp = offset(c, 1, -1, ndir);
            if (!temp.isnull && isSharp(temp, ndir)) { return true; }
            temp = offset(c, -1, -1, ndir);
            if (!temp.isnull && temp.qans === (ndir + 3) % 4 + 2) { return true; }
            temp = offset(c, -1, 1, ndir);
            if (!temp.isnull && temp.qans === ndir + 2) { return true; }
            temp = offset(c, 1, 1, ndir);
            if (!temp.isnull && temp.qans === (ndir + 1) % 4 + 2) { return true; }
            temp = offset(c, 2, 0, ndir);
            if (!temp.isnull && temp.qans === (ndir + 1) % 4 + 2) { return true; }
            temp = offset(c, 0, -2, ndir);
            if (!temp.isnull && temp.qans === (ndir + 3) % 4 + 2) { return true; }
            temp = offset(c, 2, -1, ndir);
            if (!temp.isnull && temp.qans === (ndir + 2) % 4 + 2) { return true; }
            temp = offset(c, 1, -2, ndir);
            if (!temp.isnull && temp.qans === (ndir + 2) % 4 + 2) { return true; }
            return false;
        };
        //extend of isntTri including some complex logic
        let isntTriEx = function (c, ndir) { //0 = bl, 1 = br, 2 = tr, 3 = tl
            if (isntTri(c, ndir)) { return true; }
            let templist = [offset(c, -1, 0, ndir), offset(c, 0, 1, ndir), offset(c, -2, 0, ndir),
            offset(c, 0, 2, ndir), offset(c, -1, 1, ndir)];
            if (isEmpty(templist[0]) && isEmpty(templist[1]) && isEdgeEx(templist[2], ndir + 2) &&
                isEdgeEx(templist[3], ndir + 3) && isEmpty(templist[4]) && isntTri(templist[4], ndir + 2)) {
                return true;
            }
            return false;
        }

        //start assist
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            let adjcell = cell.adjacent;
            let trinum = 0;
            let emptynum = 0;
            let fn = function (c) {
                if (!c.isnull && c.qans >= 2) { trinum++; }
                if (isEmpty(c)) { emptynum++; }
            };
            fourside(fn, adjcell);

            //add dot

            //cannot place any triangle
            {
                let temp = true;
                for (let d = 0; d < 4; d++) {
                    temp &= isntTriEx(cell, d);
                }
                if (temp) { add_dot(cell); }
            }
            //fill rectangle
            {
                let templist = [cell, offset(cell, 1, 0), offset(cell, 0, 1), offset(cell, 1, 1)];
                if (templist.filter(c => c.isnull).length === 0) {
                    templist = templist.filter(c => c.qsub !== cqsub.dot);
                    if (templist.length === 1) {
                        add_dot(templist[0]);
                    }
                }
            }
            //dot by clue
            if (trinum === cell.qnum) {
                fourside(add_dot, adjcell);
            }
            //pattern with clue 1
            if (cell.qnum === 1) {
                for (let d = 0; d < 4; d++) {
                    let tempcell = offset(cell, -1, 0, d);
                    let tempstate = !tempcell.isnull && (isEmpty(tempcell) || tempcell.qsub === cqsub.dot);
                    tempcell = offset(cell, 0, 1, d);
                    tempstate &= !tempcell.isnull && (isEmpty(tempcell) || tempcell.qsub === cqsub.dot);
                    tempcell = offset(cell, -1, 1, d);
                    tempstate &= tempcell.qnum === cqnum.none && isntTriEx(tempcell, d + 2);
                    if (tempstate) { add_dot(offset(cell, 1, 0, d)); add_dot(offset(cell, 0, -1, d)); }
                }
            }

            //add triangle

            //cannot form non-rectangle
            if (isEmpty(cell)) {
                for (let d = 0; d < 4; d++) {
                    let templist = [offset(cell, -1, 0, d), offset(cell, 0, 1, d), offset(cell, -1, 1, d)];
                    let templist_dot = templist.filter(c => !c.isnull && !isEmpty(c) && c.qsub === cqsub.dot);
                    let templist_ndot = templist.filter(c => !c.isnull && !isEmpty(c) && c.qsub !== cqsub.dot);
                    if (templist_dot.length === 2 && templist_ndot.length === 1) {
                        let temp = templist_ndot[0];
                        if (templist.indexOf(temp) === 0 && isCorner(temp, d + 1)) { add_triangle(cell, d); break; }
                        else if (templist.indexOf(temp) === 1 && isCorner(temp, d + 3)) { add_triangle(cell, d); break; }
                        else if (templist.indexOf(temp) === 2 && isCorner(temp, d + 2)) { add_triangle(cell, d); break; }
                    }
                }
            }
            //triangle by clue
            if (emptynum === cell.qnum - trinum) {
                for (let d = 0; d < 4; d++) {
                    let adj = dir(adjcell, 4 - d);
                    if (isEmpty(adj)) {
                        if (isntTriEx(adj, d)) { add_triangle(adj, d + 1); }
                        else if (isntTriEx(adj, d + 1)) { add_triangle(adj, d); }
                    }
                }
            }
            //side extend
            if (cell.qans >= 2) {
                let ndir = cell.qans - 2;
                //rectangle needs turn or cannot turn
                if (isntTriEx(offset(cell, -1, -1, ndir), ndir)) { add_triangle(offset(cell, 0, -1, ndir), ndir + 3); }
                else if (isntTriEx(offset(cell, 0, -1, ndir), ndir + 3)) { add_triangle(offset(cell, -1, -1, ndir), ndir); }
                if (isntTriEx(offset(cell, 1, 1, ndir), ndir)) { add_triangle(offset(cell, 1, 0, ndir), ndir + 1); }
                else if (isntTriEx(offset(cell, 1, 0, ndir), ndir + 1)) { add_triangle(offset(cell, 1, 1, ndir), ndir); }
                //only one opposite side position
                if (isEdgeEx(offset(cell, 2, -1, ndir), ndir)) { add_triangle(offset(cell, 1, -1, ndir), ndir + 2); }
                else if (isEdgeEx(offset(cell, 1, -2, ndir), ndir + 1)) { add_triangle(offset(cell, 1, -1, ndir), ndir + 2); }
                else if (isSharp(offset(cell, 2, -2, ndir), ndir)) { add_triangle(offset(cell, 1, -1, ndir), ndir + 2); }
                //rectangle opposite side extend
                let temp = cell;
                while (!offset(temp, -1, -1, ndir).isnull && offset(temp, -1, -1, ndir).qans === cell.qans) {
                    temp = offset(temp, -1, -1, ndir);
                }
                let turn1 = offset(temp, 0, -1, ndir);
                if (turn1.qans === (ndir + 3) % 4 + 2) {
                    let temp = cell;
                    while (!offset(temp, 1, 1, ndir).isnull && offset(temp, 1, 1, ndir).qans === cell.qans) {
                        temp = offset(temp, 1, 1, ndir);
                    }
                    let turn2 = offset(temp, 1, 0, ndir);
                    if (turn2.qans === (ndir + 1) % 4 + 2) {
                        turn1 = offset(turn1, 1, -1, ndir);
                        turn2 = offset(turn2, 1, -1, ndir);
                        while ((!turn1.isnull && turn1.qans === (ndir + 3) % 4 + 2) ||
                            (!turn2.isnull && turn2.qans === (ndir + 1) % 4 + 2)) {
                            add_triangle(turn1, ndir + 3);
                            add_triangle(turn2, ndir + 1);
                            turn1 = offset(turn1, 1, -1, ndir);
                            turn2 = offset(turn2, 1, -1, ndir);
                        }
                    }
                }
            }
            //2x2 pattern
            if (isEmpty(cell)) {
                for (let d = 0; d < 4; d++) {
                    let templist = [offset(cell, -1, 0, d), offset(cell, 0, -1, d), offset(cell, 0, 1, d),
                    offset(cell, -1, -1, d), offset(cell, 0, -2, d)];
                    if (!templist[0].isnull && templist[0].qsub === cqsub.dot && isEmpty(templist[1]) &&
                        isEdge(templist[2], d + 3) && isEdge(templist[3], d + 1) && isEdgeEx(templist[4], d + 1)) {
                        add_triangle(cell, d);
                        break;
                    }
                    templist = [offset(cell, 0, 1, d), offset(cell, 1, 0, d), offset(cell, -1, 0, d),
                    offset(cell, 1, 1, d), offset(cell, 2, 0, d)];
                    if (!templist[0].isnull && templist[0].qsub === cqsub.dot && isEmpty(templist[1]) &&
                        isEdge(templist[2], d + 2) && isEdge(templist[3], d) && isEdgeEx(templist[4], d)) {
                        add_triangle(cell, d);
                        break;
                    }
                }
            }
        }
    }

    function HeyawakeAssist() {
        GreenConnectedInCell();
        BlockNotAdjacent();
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            let adjcell = cell.adjacent;
            let blocknum = 0;
            let fn = function (c) {
                blocknum += c.isnull || c.qans === cqans.block;
            };
            fourside(fn, adjcell);
            //no two facing doors
            for (let d = 0; d < 4; d++) {
                if (cell.qsub !== cqsub.green) { break; }
                let pcell = dir(cell.adjacent, d);
                let bordernum = 0;
                let emptycellList = [cell];
                while (!pcell.isnull && pcell.qans !== cqans.block && bordernum < 2) {
                    if (dir(pcell.adjborder, d + 2).ques) {
                        bordernum++;
                    }
                    emptycellList.push(pcell);
                    pcell = dir(pcell.adjacent, d);
                }
                emptycellList = emptycellList.filter(c => c.qsub !== cqsub.green);
                if (bordernum === 2 && emptycellList.length === 1) {
                    add_block(emptycellList[0]);
                }
            }
        }
        for (let i = 0; i < board.roommgr.components.length; i++) {
            let room = board.roommgr.components[i];
            if (room.top.qnum === cqnum.none) { continue; }
            let blocknum = 0;
            let emptynum = 0;
            let oddcellList = [];
            let evencellList = [];
            let minx = room.clist.getRectSize().x2;
            let maxx = room.clist.getRectSize().x1;
            let miny = room.clist.getRectSize().y2;
            let maxy = room.clist.getRectSize().y1;
            for (let j = 0; j < room.clist.length; j++) {
                let cell = room.clist[j];
                blocknum += cell.qans === cqans.block;
                emptynum += cell.qans !== cqans.block && cell.qsub !== cqsub.green;
                if (cell.qans !== cqans.block && cell.qsub !== cqsub.green && (cell.bx + cell.by) % 4 === 2) {
                    oddcellList.push(cell);
                }
                if (cell.qans !== cqans.block && cell.qsub !== cqsub.green && (cell.bx + cell.by) % 4 === 0) {
                    evencellList.push(cell);
                }
                if (cell.qans !== cqans.block && cell.qsub !== cqsub.green) {
                    minx = Math.min(minx, cell.bx);
                    maxx = Math.max(maxx, cell.bx);
                    miny = Math.min(miny, cell.by);
                    maxy = Math.max(maxy, cell.by);
                }
            }
            if (emptynum === 0) { continue; }
            //finished room
            if (blocknum === room.top.qnum) {
                for (let j = 0; j < room.clist.length; j++) {
                    add_green(room.clist[j]);
                }
            }
            //finish room
            if (blocknum + emptynum === room.top.qnum) {
                for (let j = 0; j < room.clist.length; j++) {
                    add_block(room.clist[j]);
                }
            }
            //4 in 3*3
            if (maxx - minx === 4 && maxy - miny === 4 && blocknum + 4 === room.top.qnum) {
                let ccell = board.getc(minx + 2, miny + 2)
                add_green(offset(ccell, 0, -1));
                add_green(offset(ccell, 0, +1));
                add_green(offset(ccell, -1, 0));
                add_green(offset(ccell, +1, 0));
                let fn = function (c) { return c.isnull || c.qans === cqans.block; }
                if (fn(offset(ccell, +2, 0)) || fn(offset(ccell, 0, +2))) { add_block(offset(ccell, -1, -1)); }
                if (fn(offset(ccell, +2, 0)) || fn(offset(ccell, 0, -2))) { add_block(offset(ccell, -1, +1)); }
                if (fn(offset(ccell, -2, 0)) || fn(offset(ccell, 0, +2))) { add_block(offset(ccell, +1, -1)); }
                if (fn(offset(ccell, -2, 0)) || fn(offset(ccell, 0, -2))) { add_block(offset(ccell, +1, +1)); }
            }
            //2 in 2*2 at corner
            if (maxx - minx === 2 && maxy - miny === 2 && blocknum + 2 === room.top.qnum) {
                if (minx - 1 === board.minbx && miny - 1 === board.minby || maxx + 1 === board.maxbx && maxy + 1 === board.maxby) {
                    add_block(board.getc(minx, miny));
                    add_block(board.getc(maxx, maxy));
                }
                if (minx - 1 === board.minbx && maxy + 1 === board.maxby || maxx + 1 === board.maxbx && miny - 1 === board.minby) {
                    add_block(board.getc(minx + 2, miny));
                    add_block(board.getc(minx, miny + 2));
                }
            }
            //3 in 2*3 at side
            if ((maxx - minx === 4 && maxy - miny === 2 || maxx - minx === 2 && maxy - miny === 4) && blocknum + 3 === room.top.qnum) {
                if (maxx - 3 === board.minbx || maxy - 3 === board.minby) {
                    add_block(board.getc(minx, miny + 2));
                    add_block(board.getc(minx + 2, miny));
                }
                if (minx + 3 === board.maxbx || miny + 3 == board.maxby) {
                    add_block(board.getc(maxx, maxy - 2));
                    add_block(board.getc(maxx - 2, maxy));
                }
            }
            let connectedcellList = [];
            let fn = function (c) {
                if (connectedcellList.indexOf(c.id) !== -1) { return; }
                if (c.isnull || c.qans === cqans.block || c.qsub === cqsub.green) { return; }
                if (c.room !== room) { return; }
                connectedcellList.push(c.id);
                fourside(fn, c.adjacent);
            }
            fn(oddcellList.length > 0 ? oddcellList[0] : evencellList[0]);
            if (connectedcellList.length < emptynum) { continue; }
            if (!(maxx - minx <= 2 || maxy - miny <= 2 || (maxx - minx === 4 && maxy - miny === 4))) { continue; }
            //add at odd
            if (blocknum + oddcellList.length === room.top.qnum && oddcellList.length > evencellList.length) {
                for (let j = 0; j < oddcellList.length; j++) {
                    add_block(oddcellList[j]);
                }
            }
            //add at even
            if (blocknum + evencellList.length === room.top.qnum && evencellList.length > oddcellList.length) {
                for (let j = 0; j < evencellList.length; j++) {
                    add_block(evencellList[j]);
                }
            }
        }
    }

    function AkariAssist() {
        let isEmpty = function (c) { return !c.isnull && c.qnum === cqnum.none && c.qans !== cqans.light && c.qsub !== cqsub.dot; };
        let isNotLight = function (c) { return c.isnull || c.qnum !== cqnum.none || c.qsub === cqsub.dot; }
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            let adjcell = cell.adjacent;
            let emptynum = 0;
            let lightnum = 0;
            //add dot where lighted
            if (cell.qlight && cell.qans !== cqans.light) {
                add_dot(cell);
            }
            //only one place can light
            if (cell.qnum === cqnum.none && !cell.qlight) {
                let emptycellList = [];
                if (cell.qsub !== cqsub.dot) {
                    emptycellList.push(cell);
                }
                for (let d = 0; d < 4; d++) {
                    let pcell = dir(cell.adjacent, d);
                    while (!pcell.isnull && pcell.qnum === cqnum.none) {
                        emptycellList.push(pcell);
                        pcell = dir(pcell.adjacent, d);
                    }
                }
                emptycellList = emptycellList.filter(c => c.qsub !== cqsub.dot);
                if (emptycellList.length === 1) {
                    add_light(emptycellList[0]);
                }
            }
            let fn = function (c) {
                if (!c.isnull && c.qnum === cqnum.none && c.qsub !== cqsub.dot && c.qans !== cqans.light) { emptynum++; }
                lightnum += (c.qans === cqans.light);
            };
            fourside(fn, adjcell);
            if (cell.qnum >= 0) {
                //finished clue
                if (cell.qnum === lightnum) {
                    fourside(add_dot, adjcell);
                }
                //finish clue
                if (cell.qnum === emptynum + lightnum) {
                    fourside(add_light, adjcell);
                }
                //dot at corner
                if (cell.qnum - lightnum + 1 === emptynum) {
                    for (let d = 0; d < 4; d++) {
                        if (isEmpty(offset(cell, 0, 1, d)) && isEmpty(offset(cell, 1, 0, d)) && isEmpty(offset(cell, 1, 1, d))) {
                            add_dot(offset(cell, 1, 1, d));
                        }
                    }
                }
            }
            //3 & 1
            if (cell.qnum === 3) {
                for (let d = 0; d < 4; d++) {
                    if (!offset(cell, 1, 1, d).isnull && offset(cell, 1, 1, d).qnum === 1) {
                        add_light(offset(cell, -1, 0, d));
                        add_light(offset(cell, 0, -1, d));
                        add_dot(offset(cell, 1, 2, d));
                        add_dot(offset(cell, 2, 1, d));
                    }
                }
            }
            //2 & 1
            if (cell.qnum === 2) {
                for (let d = 0; d < 4; d++) {
                    if (!offset(cell, 1, 1, d).isnull && offset(cell, 1, 1, d).qnum === 1) {
                        add_dot(offset(cell, -1, -1, d));
                    }
                }
            }
            //1 & 1
            if (cell.qnum === 1) {
                for (let d = 0; d < 4; d++) {
                    if (!offset(cell, 1, 1, d).isnull && offset(cell, 1, 1, d).qnum === 1 &&
                        isNotLight(offset(cell, 1, 2, d)) && isNotLight(offset(cell, 2, 1, d))) {
                        add_dot(offset(cell, -1, 0, d));
                        add_dot(offset(cell, 0, -1, d));
                    }
                }
            }
        }
    }

    function MasyuAssist() {
        SingleLoopInCell(0);
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            let adjcell = cell.adjacent;
            let adjline = cell.adjborder;
            {
                for (let d = 0; d < 4; d++) {
                    if (dir(adjcell, d + 1).qnum === cqnum.bcir && dir(adjcell, d + 3).qnum === cqnum.bcir &&
                        (dir(adjline, d + 2).isnull || dir(adjline, d + 2).qsub === bqsub.cross)) {
                        add_cross(dir(adjline, d));
                    }
                }
            }
            if (cell.qnum === cqnum.wcir) {//white
                for (let d = 0; d < 4; d++) {
                    //go straight
                    if (dir(adjline, d).line || dir(adjline, d + 1).qsub === bqsub.cross || dir(adjline, d + 1).isnull) {
                        add_line(dir(adjline, d));
                        add_line(dir(adjline, d + 2));
                        add_cross(dir(adjline, d + 1));
                        add_cross(dir(adjline, d + 3));
                    }
                    //turn at one side
                    if (dir(adjline, d).line && dir(dir(adjcell, d).adjborder, d).line) {
                        add_cross(dir(dir(adjcell, d + 2).adjborder, d + 2));
                    }
                    //no turn on both side
                    if ((!dir(adjcell, d).isnull && (dir(dir(adjcell, d).adjborder, d).line ||
                        dir(dir(adjcell, d).adjborder, d + 1).qsub === bqsub.cross && dir(dir(adjcell, d).adjborder, d + 3).qsub === bqsub.cross
                    ) || dir(adjcell, d).qnum === cqnum.wcir) &&
                        (!dir(adjcell, d + 2).isnull && (dir(dir(adjcell, d + 2).adjborder, d + 2).line ||
                            dir(dir(adjcell, d + 2).adjborder, d + 1).qsub === bqsub.cross && dir(dir(adjcell, d + 2).adjborder, d + 3).qsub === bqsub.cross
                        ) || dir(adjcell, d + 2).qnum === cqnum.wcir)) {
                        add_line(dir(adjline, d + 1));
                        add_line(dir(adjline, d + 3));
                        add_cross(dir(adjline, d));
                        add_cross(dir(adjline, d + 2));
                    }
                }
            }
            if (cell.qnum === cqnum.bcir) {//black
                for (let d = 0; d < 4; d++) {
                    //can't go straight this way
                    if (dir(adjcell, d).isnull || dir(adjline, d).qsub === bqsub.cross ||
                        dir(dir(adjcell, d).adjacent, d).isnull || dir(dir(adjcell, d).adjborder, d).qsub === bqsub.cross ||
                        dir(adjcell, d).qnum === cqnum.bcir || dir(adjline, d + 2).line) {
                        add_cross(dir(adjline, d));
                        add_line(dir(adjline, d + 2));
                    }
                    //going straight this way will branch
                    if (dir(adjcell, d).isnull || dir(dir(adjcell, d).adjborder, d + 1).line ||
                        dir(dir(adjcell, d).adjborder, d + 3).line) {
                        add_cross(dir(adjline, d));
                        add_line(dir(adjline, d + 2));
                    }
                    //go straight
                    if (dir(adjline, d).line) {
                        add_line(dir(dir(adjcell, d).adjborder, d));
                    }
                }
            }
        }
    }

    function SimpleloopAssist() {
        SingleLoopInCell(1);
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            let adjline = cell.adjborder;
            if (cell.ques === cques.block) {
                fourside(add_cross, adjline);
            }
        }
    }

    function YajilinAssist() {
        SingleLoopInCell(0);
        let isPathable = function (c) { return !c.isnull && c.qnum === cqnum.none && c.qans !== cqans.block; };
        let isEmpty = function (c) { return !c.isnull && c.qnum === cqnum.none && c.qans !== cqans.block && c.qsub !== cqsub.dot && c.lcnt === 0; };
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            let emptynum = 0;
            let linenum = 0;
            let adjcell = cell.adjacent;
            let adjline = cell.adjborder;
            //check clue
            if (cell.qnum >= 0 && cell.qdir !== qdir.none) {
                let d = qdirremap(cell.qdir);
                let emptynum = 0;
                let blocknum = 0;
                let lastcell = cell;
                let pcell = dir(cell.adjacent, d);
                let emptycellList = [];
                let addcellList = [];
                while (!pcell.isnull && (pcell.qdir !== cell.qdir || pcell.qnum < 0)) {
                    if (isEmpty(pcell)) {
                        emptynum++;
                        emptycellList.push(pcell);
                    }
                    blocknum += pcell.qans === cqans.block;
                    if (isEmpty(lastcell) && isEmpty(pcell)) {
                        lastcell = cell;
                        emptynum--;
                    } else {
                        if (isEmpty(lastcell) && !isEmpty(pcell)) {
                            addcellList.push(lastcell);
                        }
                        lastcell = pcell;
                    }
                    pcell = dir(pcell.adjacent, d);
                }
                if (isEmpty(lastcell)) {
                    addcellList.push(lastcell);
                }
                if (!pcell.isnull) {
                    blocknum += pcell.qnum;
                }
                //finish clue
                if (emptynum + blocknum === cell.qnum) {
                    addcellList.forEach(cell => add_block(cell, 1));
                }
                //finished clue
                if (blocknum === cell.qnum) {
                    emptycellList.forEach(cell => add_dot(cell));
                }
            }
            //add cross
            if (cell.qnum !== cqnum.none) {
                fourside(add_cross, adjline);
                continue;
            }
            //add dot around block
            if (cell.qans === cqans.block) {
                fourside(add_cross, adjline);
                fourside(add_dot, adjcell);
                continue;
            }
            let fn = function (c, b) {
                if (isPathable(c) && b.qsub !== bqsub.cross) { emptynum++; }
                linenum += b.line;
            };
            fourside2(fn, adjcell, adjline);
            //no branch
            if (linenum === 2) {
                fourside(add_cross, adjline);
            }
            //no deadend
            if (emptynum <= 1) {
                add_block(cell);
                fourside(add_cross, adjline);
                fourside(add_dot, adjcell);
            }
            //2 degree cell no deadend
            if (emptynum === 2) {
                let fn = function (c, b) {
                    if (!isPathable(c) || b.qsub === bqsub.cross) { return; }
                    add_dot(c);
                };
                fourside2(fn, adjcell, adjline);
            }
        }
    }

    function SlitherlinkAssist() {
        ui.toolarea.outlineshaded();
        let add_bg_color = function (c, color) {
            if (c === undefined || c.isnull || c.qsub !== cqsub.none || c.qsub === color) { return; }
            if (step && flg) { return; }
            flg = true;
            c.setQsub(color);
            c.draw();
        }
        let add_bg_inner_color = function (c) {
            add_bg_color(c, cqsub.green);
        }
        let add_bg_outer_color = function (c) {
            add_bg_color(c, cqsub.yellow);
        }
        CellConnected(
            function (c) { return c.qsub === cqsub.green; },
            function (c) { return c.qsub === cqsub.yellow; },
            add_bg_inner_color
        );
        let twonum = 0;
        let threenum = 0;
        for (let i = 0; i < board.cell.length; i++) {
            twonum += board.cell[i].qnum === 2;
            threenum += board.cell[i].qnum === 3;
        }
        // deduce cell
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            let adjcell = cell.adjacent;
            let adjline = cell.adjborder;
            let emptynum = 0;
            let linenum = 0;
            //add cross for 0
            if (cell.qnum === 0) {
                fourside(add_cross, adjline);
            }
            let fn = function (b) {
                if (b.qsub !== bqsub.cross) { emptynum++; }
                linenum += (b.line);
            };
            fourside(fn, adjline);
            //finish number
            if (emptynum === cell.qnum) {
                fourside(add_line, adjline);
            }
            //add cross for finished number
            if (linenum === cell.qnum) {
                fourside(add_cross, adjline);
            }
            // vertical 3s
            if (cell.qnum === 3 && !adjcell.bottom.isnull && adjcell.bottom.qnum === 3 && (threenum > 2 || twonum > 0)) {
                add_line(cell.adjborder.top);
                add_line(cell.adjborder.bottom);
                add_line(adjcell.bottom.adjborder.bottom);
                if (!adjcell.left.isnull) { add_cross(adjcell.left.adjborder.bottom); }
                if (!adjcell.right.isnull) { add_cross(adjcell.right.adjborder.bottom); }
            }
            // horizontal 3s
            if (cell.qnum === 3 && !adjcell.right.isnull && adjcell.right.qnum === 3 && (threenum > 2 || twonum > 0)) {
                add_line(cell.adjborder.left);
                add_line(cell.adjborder.right);
                add_line(adjcell.right.adjborder.right);
                if (!adjcell.top.isnull) { add_cross(adjcell.top.adjborder.right); }
                if (!adjcell.bottom.isnull) { add_cross(adjcell.bottom.adjborder.right); }
            }
            //sub diagonal 3s
            if (cell.qnum === 3 && !adjcell.bottom.isnull && !adjcell.bottom.adjacent.left.isnull && adjcell.bottom.adjacent.left.qnum === 3) {
                let cell2 = adjcell.bottom.adjacent.left;
                add_line(cell.adjborder.top);
                add_line(cell.adjborder.right);
                add_line(cell2.adjborder.bottom);
                add_line(cell2.adjborder.left);
            }
            //main diagonal 3s
            if (cell.qnum === 3 && !adjcell.bottom.isnull && !adjcell.bottom.adjacent.right.isnull && adjcell.bottom.adjacent.right.qnum === 3) {
                let cell2 = adjcell.bottom.adjacent.right;
                add_line(cell.adjborder.top);
                add_line(cell.adjborder.left);
                add_line(cell2.adjborder.bottom);
                add_line(cell2.adjborder.right);
            }
        }
        //deduce cross
        for (let i = 0; i < board.cross.length; i++) {
            let cross = board.cross[i];
            let crsline = cross.adjborder;
            let emptynum = 0;
            let linenum = 0;
            let fn = function (b) {
                if (b !== undefined && !b.isnull && b.qsub !== bqsub.cross) { emptynum++; }
                linenum += (b.line);
            };
            fourside(fn, crsline);
            //no deadend or branch
            if (emptynum === 1 || linenum === 2) {
                fourside(add_cross, crsline);
            }
            //extend deadend
            if (emptynum === 2 && linenum === 1) {
                fourside(add_line, crsline);
            }
            //empty turn with 1 or 3
            if (emptynum === 2 && linenum === 0) {
                let fn = function (c) { return c !== undefined && !c.isnull && c.qsub === 0; }
                if (fn(crsline.top) && fn(crsline.left) && crsline.top.sidecell[0].qnum === 3) { fourside(add_line, crsline); }
                if (fn(crsline.top) && fn(crsline.right) && crsline.top.sidecell[1].qnum === 3) { fourside(add_line, crsline); }
                if (fn(crsline.bottom) && fn(crsline.left) && crsline.bottom.sidecell[0].qnum === 3) { fourside(add_line, crsline); }
                if (fn(crsline.bottom) && fn(crsline.right) && crsline.bottom.sidecell[1].qnum === 3) { fourside(add_line, crsline); }

                if (fn(crsline.top) && fn(crsline.left) && crsline.top.sidecell[0].qnum === 1) { fourside(add_cross, crsline); }
                if (fn(crsline.top) && fn(crsline.right) && crsline.top.sidecell[1].qnum === 1) { fourside(add_cross, crsline); }
                if (fn(crsline.bottom) && fn(crsline.left) && crsline.bottom.sidecell[0].qnum === 1) { fourside(add_cross, crsline); }
                if (fn(crsline.bottom) && fn(crsline.right) && crsline.bottom.sidecell[1].qnum === 1) { fourside(add_cross, crsline); }
            }
            //2 degree turn or line enter
            {
                let fn = function (b1, b2, b3, b4, b5, b6, c34) {
                    if (c34.isnull) { return; }
                    //avoid 1*1 loop with 2 degree turn
                    if ((b1.isnull || b1.qsub === bqsub.cross) && (b2.isnull || b2.qsub === bqsub.cross) && b5.line && b6.line) {
                        add_cross(b3);
                        add_cross(b4);
                    }
                    //line enters 1
                    if (!b1.isnull && b1.line && (b2.isnull || b2.qsub === bqsub.cross) && c34.qnum === 1) {
                        add_cross(b5);
                        add_cross(b6);
                    }
                    //2 degree turn with 2
                    if ((b1.isnull || b1.qsub === bqsub.cross) && (b2.isnull || b2.qsub === bqsub.cross) && (b5.qsub === bqsub.cross || b6.qsub === bqsub.cross) && c34.qnum === 2) {
                        add_line(b3);
                        add_line(b4);
                        add_cross(b5);
                        add_cross(b6);
                    }
                    if ((b1.isnull || b1.qsub === bqsub.cross) && (b2.isnull || b2.qsub === bqsub.cross) && (b5.line || b6.line) && c34.qnum === 2) {
                        add_cross(b3);
                        add_cross(b4);
                        add_line(b5);
                        add_line(b6);
                    }
                    //line enters 3
                    if (!b1.isnull && b1.line && c34.qnum === 3) {
                        add_cross(b2);
                        add_line(b5);
                        add_line(b6);
                    }
                    //line exit 1
                    if ((b2.isnull || b2.qsub === bqsub.cross) && c34.qnum === 1 && b5.qsub === bqsub.cross && b6.qsub === bqsub.cross) {
                        add_line(b1);
                    }
                    //line exit 2
                    if ((b2.isnull || b2.qsub === bqsub.cross) && c34.qnum === 2 && (b5.qsub === bqsub.cross && b6.line || b6.qsub === bqsub.cross && b5.line)) {
                        add_line(b1);
                    }
                    //line exit 3
                    if ((b2.isnull || b2.qsub === bqsub.cross) && c34.qnum === 3 && b5.line && b6.line) {
                        add_line(b1);
                    }
                    //line should enter 1
                    if (b1.line && c34.qnum === 1 && b5.qsub === bqsub.cross && b6.qsub === bqsub.cross) {
                        add_cross(b2);
                    }
                    //line should enter 2
                    if (b1.line && c34.qnum === 2 && (b5.qsub === bqsub.cross || b6.qsub === bqsub.cross)) {
                        add_cross(b2);
                        add_line(b5);
                        add_line(b6);
                    }
                };
                if (!crsline.bottom.isnull) {
                    fn(crsline.top, crsline.left, crsline.bottom, crsline.right, crsline.bottom.sidecell[1].adjborder.bottom, crsline.bottom.sidecell[1].adjborder.right, crsline.bottom.sidecell[1]);
                    fn(crsline.left, crsline.top, crsline.bottom, crsline.right, crsline.bottom.sidecell[1].adjborder.bottom, crsline.bottom.sidecell[1].adjborder.right, crsline.bottom.sidecell[1]);
                    fn(crsline.top, crsline.right, crsline.bottom, crsline.left, crsline.bottom.sidecell[0].adjborder.bottom, crsline.bottom.sidecell[0].adjborder.left, crsline.bottom.sidecell[0]);
                    fn(crsline.right, crsline.top, crsline.bottom, crsline.left, crsline.bottom.sidecell[0].adjborder.bottom, crsline.bottom.sidecell[0].adjborder.left, crsline.bottom.sidecell[0]);
                }
                if (!crsline.top.isnull) {
                    fn(crsline.bottom, crsline.left, crsline.top, crsline.right, crsline.top.sidecell[1].adjborder.top, crsline.top.sidecell[1].adjborder.right, crsline.top.sidecell[1]);
                    fn(crsline.left, crsline.bottom, crsline.top, crsline.right, crsline.top.sidecell[1].adjborder.top, crsline.top.sidecell[1].adjborder.right, crsline.top.sidecell[1]);
                    fn(crsline.bottom, crsline.right, crsline.top, crsline.left, crsline.top.sidecell[0].adjborder.top, crsline.top.sidecell[0].adjborder.left, crsline.top.sidecell[0]);
                    fn(crsline.right, crsline.bottom, crsline.top, crsline.left, crsline.top.sidecell[0].adjborder.top, crsline.top.sidecell[0].adjborder.left, crsline.top.sidecell[0]);
                }
            }
        }
        //avoid forming multiple loop
        for (let i = 0; i < board.border.length; i++) {
            let border = board.border[i];
            if (border.qsub === bqsub.cross) { continue; }
            if (border.line) { continue; }
            let cr1 = border.sidecross[0];
            let cr2 = border.sidecross[1];
            if (cr1.path !== null && cr1.path === cr2.path && board.linegraph.components.length > 1) {
                add_cross(border);
            }
        }
        //deduce color
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            let adjline = cell.adjborder;
            let adjcell = cell.adjacent;
            //same neighbor color
            {
                let fn = function (c, d) {
                    if (!c.isnull && cell.qsub !== cqsub.none && cell.qsub === c.qsub) {
                        add_cross(d);
                    }
                    if (cell.qsub === cqsub.yellow && c.isnull) {
                        add_cross(d);
                    }
                };
                fourside2(fn, adjcell, adjline);
            }
            //deduce neighbor color
            if (cell.qsub === cqsub.none) {
                let fn = function (c, b) {
                    if (b.line && c.isnull) {
                        add_bg_inner_color(cell);
                    }
                    if (b.qsub === bqsub.cross && c.isnull) {
                        add_bg_outer_color(cell);
                    }
                    if (b.line && !c.isnull && c.qsub !== cqsub.none) {
                        add_bg_color(cell, cqsub.green + cqsub.yellow - c.qsub);
                    }
                    if (b.qsub === bqsub.cross && !c.isnull && c.qsub !== cqsub.none) {
                        add_bg_color(cell, c.qsub);
                    }
                };
                fourside2(fn, adjcell, adjline);
            }
            //checker pattern
            if (cell.qsub === cqsub.none) {
                let fn = function (c, c1, c2, c12) {
                    if (c1.isnull || c2.isnull || c12.isnull) { return; }
                    if (c1.qsub === cqsub.none || c2.qsub === cqsub.none || c12.qsub === cqsub.none) { return; }
                    if (c1.qsub === c2.qsub && c1.qsub !== c12.qsub) {
                        add_bg_color(c, c1.qsub);
                    }
                };
                for (let d = 0; d < 4; d++) {
                    fn(cell, offset(cell, 1, 0, d), offset(cell, 0, 1, d), offset(cell, 1, 1, d));
                }
            }
            //number and color deduce
            if (cell.qnum >= 0) {
                let innernum = 0;
                let outernum = 0;
                let fn = function (c) {
                    if (!c.isnull && c.qsub === cqsub.green) { innernum++; }
                    if (c.isnull || c.qsub === cqsub.yellow) { outernum++; }
                };
                fourside(fn, adjcell);
                //surrounded by green
                if (innernum === 4) {
                    add_bg_inner_color(cell);
                }
                if (cell.qnum < innernum || 4 - cell.qnum < outernum) {
                    add_bg_inner_color(cell);
                }
                if (cell.qnum < outernum || 4 - cell.qnum < innernum) {
                    add_bg_outer_color(cell);
                }
                if (cell.qsub === cqsub.green && cell.qnum === outernum) {
                    fourside(add_bg_inner_color, adjcell);
                }
                if (cell.qsub === cqsub.yellow && cell.qnum === innernum) {
                    fourside(add_bg_outer_color, adjcell);
                }
                if (cell.qsub === cqsub.yellow && cell.qnum === 4 - outernum) {
                    fourside(add_bg_inner_color, adjcell);
                }
                if (cell.qsub === cqsub.green && cell.qnum === 4 - innernum) {
                    fourside(add_bg_outer_color, adjcell);
                }
                if (cell.qnum === cqsub.yellow && outernum === 2) {
                    fourside(add_bg_inner_color, adjcell);
                }
                if (cell.qnum === cqsub.yellow && innernum === 2) {
                    fourside(add_bg_outer_color, adjcell);
                }
                //2 different color around 1 or 3
                {
                    let fn = function (c, d) {
                        if (!c.isnull && c.qsub === cqsub.none) {
                            if (cell.qnum === 1) { add_cross(d); }
                            if (cell.qnum === 3) { add_line(d); }
                        }
                    };
                    if ((cell.qnum === 1 || cell.qnum === 3) && innernum === 1 && outernum === 1) {
                        fourside2(fn, adjcell, adjline);
                    }
                }
                //same diagonal color as 3
                if (cell.qnum === 3 && cell.qsub !== cqsub.none) {
                    for (let d = 0; d < 4; d++) {
                        if (!dir(adjcell, d).isnull && !dir(adjcell, d + 1).isnull && dir(dir(adjcell, d).adjacent, d + 1).qsub === cell.qsub) {
                            add_line(dir(adjline, d + 2));
                            add_line(dir(adjline, d + 3));
                        }
                    }
                }
            }
        }
    }

})();