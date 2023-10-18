// ==UserScript==
// @name         Puzz.link Assistance
// @version      23.10.18.1
// @description  Do trivial deduction.
// @author       Leaving Leaves
// @match        https://puzz.link/p*/*
// @match        https://pzplus.tck.mn/p*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const maxLoop = 30;
    let flg = true;
    let step = false;
    let board;

    //const list
    const cqnum = {
        quesmark: -2,
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
    };

    const cques = {
        none: 0,
        ice: 6,
        blackwall: 7,
        circle: 41,
        triangle: 42,
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
        [/lightup|akari/, AkariAssist],
        [/heyawake/, HeyawakeAssist],
        [/shakashaka/, ShakashakaAssist],
        [/ayeheya/, EkawayehAssist],
        [/nothree/, NothreeAssist],
        [/lits/, LitsAssist],
        [/icebarn/, IcebarnAssist],
        [/aquapelago/, AquapelagoAssist],
        [/nurimaze/, NurimazeAssist],
        [/yinyang/, YinyangAssist]
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
            genrelist.filter(g => g[0].test(document.URL))[0][1]();
        }
        ui.puzzle.redraw();
        console.log('Assisted.');
    }

    let offset = function (c, dx, dy, dir = 0) {
        dir = (dir % 4 + 4) % 4;
        if (dir === 0) { return board.getc(c.bx + dx * 2, c.by + dy * 2); }
        if (dir === 1) { return board.getc(c.bx + dy * 2, c.by - dx * 2); }
        if (dir === 2) { return board.getc(c.bx - dx * 2, c.by - dy * 2); }
        if (dir === 3) { return board.getc(c.bx - dy * 2, c.by + dx * 2); }
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

    function CellConnected(isBlock, isGreen, setBlock, setGreen) {
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            if (isBlock(cell) || isGreen(cell)) { continue; }
            let templist = [offset(cell, -1, -1), offset(cell, -1, 0), offset(cell, -1, 1), offset(cell, 0, -1),
            offset(cell, 0, 1), offset(cell, 1, -1), offset(cell, 1, 0), offset(cell, 1, 1)];
            templist = templist.filter(c => !c.isnull && !isGreen(c));
            if (templist.length === 0) {
                setGreen(cell);
                continue;
            }
            if (templist.length >= 7) { continue; }
            let sparenum = 0;
            let fn = function (c) {
                let dfslist = [];
                let dfs = function (c) {
                    if (c.isnull || c === cell || isGreen(c) || dfslist.indexOf(c) !== -1) { return; }
                    dfslist.push(c);
                    fourside(dfs, c.adjacent);
                };
                dfs(c);
                if (dfslist.filter(c => isBlock(c)).length === 0) {
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

    function CellNoLoop(isBlock, isGreen, setBlock, setGreen) {
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
            add_green,
            add_block
        );
    }

    function BlockConnectedInCell() {
        CellConnected(
            function (c) { return c.qans === cqans.block; },
            function (c) { return c.qsub === cqsub.green; },
            add_block,
            add_green
        );
    }

    function GreenNoLoopInCell() {
        CellNoLoop(
            function (c) { return c.qsub === cqsub.green; },
            function (c) { return c.qans === cqans.block; },
            add_green,
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
            if (cell.ques === cques.blackwall) { continue; }
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

    //assist for certain genre

    function YinyangAssist() {
        let add_color = function (c, color) {
            if (c === undefined || c.isnull || c.anum !== canum.none) { return; }
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
            add_white,
            add_black
        );
        CellConnected(
            function (c) { return c.anum === canum.bcir; },
            function (c) { return c.anum === canum.wcir; },
            add_black,
            add_white
        );
        No2x2Cell(
            function (c) { return c.anum === canum.wcir; },
            add_black
        );
        No2x2Cell(
            function (c) { return c.anum === canum.bcir; },
            add_white
        );
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
    }

    function NurimazeAssist() {
        No2x2Block();
        No2x2Green();
        GreenConnectedInCell();
        GreenNoLoopInCell();
        let startcell = board.getc(board.startpos.bx, board.startpos.by);
        let goalcell = board.getc(board.goalpos.bx, board.goalpos.by);
        for (let i = 0; i < board.roommgr.components.length; i++) {
            let room = board.roommgr.components[i];
            let templist = [];
            for (let j = 0; j < room.clist.length; j++) {
                templist.push(room.clist[j]);
            }
            if (templist.filter(c => c.qsub === cqsub.green || c.ques === cques.circle || c.ques === cques.triangle).length > 0 ||
                room === startcell.room || room === goalcell.room) {
                templist.forEach(c => add_green(c));
            }
            if (templist.filter(c => c.qans).length > 0) {
                templist.forEach(c => add_block(c));
            }
        }
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            let templist = [cell, offset(cell, 1, 0), offset(cell, 0, 1), offset(cell, 1, 1)];
            if (templist.filter(c => c.isnull).length > 0) { continue; }
            if (templist.filter(c => c.qsub === cqsub.green).length === 0) {
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
        let isEmpty = function (c) { return !c.isnull && c.qnum === -1 && c.qsub === 0 && c.qans === 0; };
        //draw triangle
        let add_triangle = function (c, ans) {
            if (c === undefined || c.isnull || !isEmpty(c)) { return; }
            if (step && flg) { return; }
            flg = true;
            c.setQans(ans);
        };
        //check blocking edge
        let isTopEdge = function (c) { return c.isnull || c.qnum !== -1 || c.qans === 4 || c.qans === 5; };
        let isBottomEdge = function (c) { return c.isnull || c.qnum !== -1 || c.qans === 2 || c.qans === 3; };
        let isLeftEdge = function (c) { return c.isnull || c.qnum !== -1 || c.qans === 2 || c.qans === 5; };
        let isRightEdge = function (c) { return c.isnull || c.qnum !== -1 || c.qans === 3 || c.qans === 4; };
        //check blocking corner
        let isBLCorner = function (c) { return c.isnull || c.qnum !== -1 || c.qans === 2; };
        let isBRCorner = function (c) { return c.isnull || c.qnum !== -1 || c.qans === 3; };
        let isTRCorner = function (c) { return c.isnull || c.qnum !== -1 || c.qans === 4; };
        let isTLCorner = function (c) { return c.isnull || c.qnum !== -1 || c.qans === 5; };
        //check blocking sharp
        let isBLSharp = function (c) { return c.isnull || c.qnum !== -1 || c.qans === 2 || c.qans === 3 || c.qans === 5; };
        let isBRSharp = function (c) { return c.isnull || c.qnum !== -1 || c.qans === 2 || c.qans === 3 || c.qans === 4; };
        let isTRSharp = function (c) { return c.isnull || c.qnum !== -1 || c.qans === 3 || c.qans === 4 || c.qans === 5; };
        let isTLSharp = function (c) { return c.isnull || c.qnum !== -1 || c.qans === 2 || c.qans === 4 || c.qans === 5; };
        //check if stick edge
        let isStickEdge = function (c) { return isBottomEdge(c.adjacent.top) || isTopEdge(c.adjacent.bottom) || isRightEdge(c.adjacent.left) || isLeftEdge(c.adjacent.right); }
        //if can place triangle of specific direction
        let isntBLTri = function (c) {
            let adj = c.adjacent;
            if (!isEmpty(c) || isBottomEdge(adj.top) || isLeftEdge(adj.right)) { return true; }
            if ((adj.top.qsub === 1 && isStickEdge(adj.top)) || (adj.right.qsub === 1 && isStickEdge(adj.right))) { return true; }
            if ((!adj.top.isnull && adj.top.qans === 4) || (!adj.right.isnull && adj.right.qans === 4)) { return true; }
            if ((!adj.bottom.isnull && (adj.bottom.qans === 2 || adj.bottom.qans === 3))) { return true; }
            if ((!adj.left.isnull && (adj.left.qans === 2 || adj.left.qans === 5))) { return true; }
            if (adj.top.adjacent.right !== undefined && (isBLSharp(adj.top.adjacent.right) || (adj.top.adjacent.right.qsub === 1 && isStickEdge(adj.top.adjacent.right)))) { return true; }
            if (adj.top.adjacent.left !== undefined && !adj.top.adjacent.left.isnull && adj.top.adjacent.left.qans === 5) { return true; }
            if (adj.bottom.adjacent.right !== undefined && !adj.bottom.adjacent.right.isnull && adj.bottom.adjacent.right.qans === 3) { return true; }
            if (adj.bottom.adjacent.left !== undefined && !adj.bottom.adjacent.left.isnull && adj.bottom.adjacent.left.qans === 2) { return true; }
            if (adj.top.adjacent.top !== undefined && !adj.top.adjacent.top.isnull && adj.top.adjacent.top.qans === 5) { return true; }
            if (adj.right.adjacent.right !== undefined && !adj.right.adjacent.right.isnull && adj.right.adjacent.right.qans === 3) { return true; }
            if (adj.top.adjacent.right !== undefined && !adj.top.adjacent.right.isnull) {
                if (!adj.top.adjacent.right.adjacent.top.isnull && adj.top.adjacent.right.adjacent.top.qans === 4) { return true; }
                if (!adj.top.adjacent.right.adjacent.right.isnull && adj.top.adjacent.right.adjacent.right.qans === 4) { return true; }
            }
            return false;
        };
        let isntBRTri = function (c) {
            let adj = c.adjacent;
            if (!isEmpty(c) || isBottomEdge(adj.top) || isRightEdge(adj.left)) { return true; }
            if ((adj.top.qsub === 1 && isStickEdge(adj.top)) || (adj.left.qsub === 1 && isStickEdge(adj.left))) { return true; }
            if ((!adj.top.isnull && adj.top.qans === 5) || (!adj.left.isnull && adj.left.qans === 5)) { return true; }
            if ((!adj.bottom.isnull && (adj.bottom.qans === 2 || adj.bottom.qans === 3))) { return true; }
            if ((!adj.right.isnull && (adj.right.qans === 3 || adj.right.qans === 4))) { return true; }
            if (adj.top.adjacent.left !== undefined && (isBRSharp(adj.top.adjacent.left) || (adj.top.adjacent.left.qsub === 1 && isStickEdge(adj.top.adjacent.left)))) { return true; }
            if (adj.top.adjacent.right !== undefined && !adj.top.adjacent.right.isnull && adj.top.adjacent.right.qans === 4) { return true; }
            if (adj.bottom.adjacent.left !== undefined && !adj.bottom.adjacent.left.isnull && adj.bottom.adjacent.left.qans === 2) { return true; }
            if (adj.bottom.adjacent.right !== undefined && !adj.bottom.adjacent.right.isnull && adj.bottom.adjacent.right.qans === 3) { return true; }
            if (adj.top.adjacent.top !== undefined && !adj.top.adjacent.top.isnull && adj.top.adjacent.top.qans === 4) { return true; }
            if (adj.left.adjacent.left !== undefined && !adj.left.adjacent.left.isnull && adj.left.adjacent.left.qans === 2) { return true; }
            if (adj.top.adjacent.left !== undefined && !adj.top.adjacent.left.isnull) {
                if (!adj.top.adjacent.left.adjacent.top.isnull && adj.top.adjacent.left.adjacent.top.qans === 5) { return true; }
                if (!adj.top.adjacent.left.adjacent.left.isnull && adj.top.adjacent.left.adjacent.left.qans === 5) { return true; }
            }
            return false;
        };
        let isntTRTri = function (c) {
            let adj = c.adjacent;
            if (!isEmpty(c) || isTopEdge(adj.bottom) || isRightEdge(adj.left)) { return true; }
            if ((adj.bottom.qsub === 1 && isStickEdge(adj.bottom)) || (adj.left.qsub === 1 && isStickEdge(adj.left))) { return true; }
            if ((!adj.bottom.isnull && adj.bottom.qans === 2) || (!adj.left.isnull && adj.left.qans === 2)) { return true; }
            if ((!adj.top.isnull && (adj.top.qans === 4 || adj.top.qans === 5))) { return true; }
            if ((!adj.right.isnull && (adj.right.qans === 3 || adj.right.qans === 4))) { return true; }
            if (adj.bottom.adjacent.left !== undefined && (isTRSharp(adj.bottom.adjacent.left) || (adj.bottom.adjacent.left.qsub === 1 && isStickEdge(adj.bottom.adjacent.left)))) { return true; }
            if (adj.bottom.adjacent.right !== undefined && !adj.bottom.adjacent.right.isnull && adj.bottom.adjacent.right.qans === 3) { return true; }
            if (adj.top.adjacent.left !== undefined && !adj.top.adjacent.left.isnull && adj.top.adjacent.left.qans === 5) { return true; }
            if (adj.top.adjacent.right !== undefined && !adj.top.adjacent.right.isnull && adj.top.adjacent.right.qans === 4) { return true; }
            if (adj.bottom.adjacent.bottom !== undefined && !adj.bottom.adjacent.bottom.isnull && adj.bottom.adjacent.bottom.qans === 3) { return true; }
            if (adj.left.adjacent.left !== undefined && !adj.left.adjacent.left.isnull && adj.left.adjacent.left.qans === 5) { return true; }
            if (adj.bottom.adjacent.left !== undefined && !adj.bottom.adjacent.left.isnull) {
                if (!adj.bottom.adjacent.left.adjacent.bottom.isnull && adj.bottom.adjacent.left.adjacent.bottom.qans === 2) { return true; }
                if (!adj.bottom.adjacent.left.adjacent.left.isnull && adj.bottom.adjacent.left.adjacent.left.qans === 2) { return true; }
            }
            return false;
        };
        let isntTLTri = function (c) {
            let adj = c.adjacent;
            if (!isEmpty(c) || isTopEdge(adj.bottom) || isLeftEdge(adj.right)) { return true; }
            if ((adj.bottom.qsub === 1 && isStickEdge(adj.bottom)) || (adj.right.qsub === 1 && isStickEdge(adj.right))) { return true; }
            if ((!adj.bottom.isnull && adj.bottom.qans === 3) || (!adj.right.isnull && adj.right.qans === 3)) { return true; }
            if ((!adj.top.isnull && (adj.top.qans === 4 || adj.top.qans === 5))) { return true; }
            if ((!adj.left.isnull && (adj.left.qans === 2 || adj.left.qans === 5))) { return true; }
            if (adj.bottom.adjacent.right !== undefined && (isTLSharp(adj.bottom.adjacent.right) || (adj.bottom.adjacent.right.qsub === 1 && isStickEdge(adj.bottom.adjacent.right)))) { return true; }
            if (adj.bottom.adjacent.left !== undefined && !adj.bottom.adjacent.left.isnull && adj.bottom.adjacent.left.qans === 2) { return true; }
            if (adj.top.adjacent.right !== undefined && !adj.top.adjacent.right.isnull && adj.top.adjacent.right.qans === 4) { return true; }
            if (adj.top.adjacent.left !== undefined && !adj.top.adjacent.left.isnull && adj.top.adjacent.left.qans === 5) { return true; }
            if (adj.bottom.adjacent.bottom !== undefined && !adj.bottom.adjacent.bottom.isnull && adj.bottom.adjacent.bottom.qans === 2) { return true; }
            if (adj.right.adjacent.right !== undefined && !adj.right.adjacent.right.isnull && adj.right.adjacent.right.qans === 4) { return true; }
            if (adj.bottom.adjacent.right !== undefined && !adj.bottom.adjacent.right.isnull) {
                if (!adj.bottom.adjacent.right.adjacent.bottom.isnull && adj.bottom.adjacent.right.adjacent.bottom.qans === 3) { return true; }
                if (!adj.bottom.adjacent.right.adjacent.right.isnull && adj.bottom.adjacent.right.adjacent.right.qans === 3) { return true; }
            }
            return false;
        };
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
            if (isntBLTri(cell) && isntBRTri(cell) && isntTRTri(cell) && isntTLTri(cell)) {
                add_dot(cell);
            }
            //fill rectangle
            {
                let fn = function (c, c1, c2, c12) {
                    if (!c1.isnull && c1.qsub === 1 && !c2.isnull && c2.qsub === 1 && !c12.isnull && c12.qsub === 1) {
                        add_dot(c);
                    }
                };
                if (!adjcell.bottom.isnull) {
                    fn(cell, adjcell.bottom, adjcell.left, adjcell.bottom.adjacent.left);
                    fn(cell, adjcell.bottom, adjcell.right, adjcell.bottom.adjacent.right);
                }
                if (!adjcell.top.isnull) {
                    fn(cell, adjcell.top, adjcell.right, adjcell.top.adjacent.right);
                    fn(cell, adjcell.top, adjcell.left, adjcell.top.adjacent.left);
                }
            }
            //dot by clue
            if (trinum === cell.qnum) {
                fourside(add_dot, adjcell);
            }
            //pattern with clue 1
            if (cell.qnum === 1) {
                if (!adjcell.top.isnull && (isEmpty(adjcell.top) || adjcell.top.qsub === 1)) {
                    let temp = !adjcell.left.isnull && (isEmpty(adjcell.left) || adjcell.left.qsub === 1);
                    if (temp && adjcell.top.adjacent.left.qnum === -1 && adjcell.top.adjacent.left.qans !== 3 && isntBRTri(adjcell.top.adjacent.left)) {
                        add_dot(adjcell.bottom); add_dot(adjcell.right);
                    }
                    temp = !adjcell.right.isnull && (isEmpty(adjcell.right) || adjcell.right.qsub === 1);
                    if (temp && adjcell.top.adjacent.right.qnum === -1 && adjcell.top.adjacent.right.qans !== 2 && isntBLTri(adjcell.top.adjacent.right)) {
                        add_dot(adjcell.bottom); add_dot(adjcell.left);
                    }
                }
                if (!adjcell.bottom.isnull && (isEmpty(adjcell.bottom) || adjcell.bottom.qsub === 1)) {
                    let temp = !adjcell.left.isnull && (isEmpty(adjcell.left) || adjcell.left.qsub === 1);
                    if (temp && adjcell.bottom.adjacent.left.qnum === -1 && adjcell.bottom.adjacent.left.qans !== 4 && isntTRTri(adjcell.bottom.adjacent.left)) {
                        add_dot(adjcell.top); add_dot(adjcell.right);
                    }
                    temp = !adjcell.right.isnull && (isEmpty(adjcell.right) || adjcell.right.qsub === 1);
                    if (temp && adjcell.bottom.adjacent.right.qnum === -1 && adjcell.bottom.adjacent.right.qans !== 5 && isntTLTri(adjcell.bottom.adjacent.right)) {
                        add_dot(adjcell.top); add_dot(adjcell.left);
                    }
                }
            }

            //add triangle

            //cannot form non-rectangle
            {
                let fn_list1 = [isTRCorner, isTLCorner, isBLCorner, isBRCorner];
                let fn_list2 = [[isBRCorner, isTLCorner], [isBLCorner, isTRCorner], [isTLCorner, isBRCorner], [isTRCorner, isBLCorner]];
                let fn = function (c, c1, c2, c12, dir) {
                    if (!c1.isnull && c1.qsub === 1 && !c2.isnull && c2.qsub === 1 && fn_list1[dir - 2](c12)) {
                        add_triangle(c, dir);
                    }
                    else if (((!c1.isnull && c1.qsub === 1 && fn_list2[dir - 2][0](c2)) || (fn_list2[dir - 2][1](c1) && !c2.isnull && c2.qsub === 1)) && !c12.isnull && c12.qsub === 1) {
                        add_triangle(c, dir);
                    }
                };
                if (!adjcell.bottom.isnull) {
                    fn(cell, adjcell.bottom, adjcell.left, adjcell.bottom.adjacent.left, 2);
                    fn(cell, adjcell.bottom, adjcell.right, adjcell.bottom.adjacent.right, 3);
                }
                if (!adjcell.top.isnull) {
                    fn(cell, adjcell.top, adjcell.right, adjcell.top.adjacent.right, 4);
                    fn(cell, adjcell.top, adjcell.left, adjcell.top.adjacent.left, 5);
                }
            }
            //triangle by clue
            if (emptynum === cell.qnum - trinum) {
                let fn_list = [[isntBLTri, isntBRTri], [isntTLTri, isntTRTri], [isntBRTri, isntTRTri], [isntBLTri, isntTLTri]];
                let dir_list = [[3, 2], [4, 5], [4, 3], [5, 2]];
                let fn = function (c, dir) {
                    if (fn_list[dir][0](c)) { add_triangle(c, dir_list[dir][0]); }
                    else if (fn_list[dir][1](c)) { add_triangle(c, dir_list[dir][1]); }
                };
                fn(adjcell.top, 0);
                fn(adjcell.bottom, 1);
                fn(adjcell.left, 2);
                fn(adjcell.right, 3);
            }
            if (cell.qans >= 2) {
                //rectangle needs turn
                {
                    let fn_list = [isntBLTri, isntBRTri, isntTRTri, isntTLTri];
                    let ans_list = [[5, 3], [4, 2], [5, 3], [4, 2]];
                    let dir_list1 = [[adjcell.top.adjacent.left, adjcell.right.adjacent.bottom], [adjcell.top.adjacent.right, adjcell.left.adjacent.bottom],
                    [adjcell.left.adjacent.top, adjcell.bottom.adjacent.right], [adjcell.right.adjacent.top, adjcell.bottom.adjacent.left]];
                    let dir_list2 = [[adjcell.top, adjcell.right], [adjcell.top, adjcell.left], [adjcell.left, adjcell.bottom], [adjcell.right, adjcell.bottom]];
                    for (let j = 0; j < 2; j++) {
                        if (dir_list1[cell.qans - 2][j].qans !== cell.qans && fn_list[cell.qans - 2](dir_list1[cell.qans - 2][j])) {
                            add_triangle(dir_list2[cell.qans - 2][j], ans_list[cell.qans - 2][j]);
                        }
                    }
                }
                //rectangle cannot turn
                {
                    let fn_list = [[isntTLTri, isntBRTri], [isntTRTri, isntBLTri], [isntTLTri, isntBRTri], [isntTRTri, isntBLTri]];
                    let ans_list = [[5, 3], [4, 2], [5, 3], [4, 2]];
                    let dir_list1 = [[adjcell.top, adjcell.right], [adjcell.top, adjcell.left], [adjcell.left, adjcell.bottom], [adjcell.right, adjcell.bottom]];
                    let dir_list2 = [[adjcell.top.adjacent.left, adjcell.right.adjacent.bottom], [adjcell.top.adjacent.right, adjcell.left.adjacent.bottom],
                    [adjcell.left.adjacent.top, adjcell.bottom.adjacent.right], [adjcell.right.adjacent.top, adjcell.bottom.adjacent.left]];
                    for (let j = 0; j < 2; j++) {
                        if (dir_list1[cell.qans - 2][j].qans !== ans_list[cell.qans - 2][j] && fn_list[cell.qans - 2][j](dir_list1[cell.qans - 2][j])) {
                            add_triangle(dir_list2[cell.qans - 2][j], cell.qans);
                        }
                    }
                }
                //opposite side of rectangle
                {
                    let ans_list = [4, 5, 2, 3];
                    let fn_list = [[isBottomEdge, isLeftEdge, isBLSharp], [isBottomEdge, isRightEdge, isBRSharp],
                    [isTopEdge, isRightEdge, isTRSharp], [isTopEdge, isLeftEdge, isTLSharp]];
                    let fn = function (c, c1, c2, c12, dir) {
                        let temp = (fn_list[dir][0](c1) || (c1.qsub === 1 && isStickEdge(c1)));
                        temp |= (fn_list[dir][1](c2) || (c2.qsub === 1 && isStickEdge(c2)));
                        if (temp || c12 === undefined || fn_list[dir][2](c12) || (c12.qsub === 1 && isStickEdge(c12))) {
                            add_triangle(c, ans_list[dir]);
                        }
                    };
                    let temp = adjcell.top.adjacent.right;
                    if (cell.qans === 2 && temp !== undefined && isEmpty(temp)) {
                        fn(temp, temp.adjacent.top, temp.adjacent.right, temp.adjacent.top.adjacent.right, 0);
                    }
                    temp = adjcell.top.adjacent.left;
                    if (cell.qans === 3 && temp !== undefined && isEmpty(temp)) {
                        fn(temp, temp.adjacent.top, temp.adjacent.left, temp.adjacent.top.adjacent.left, 1);
                    }
                    temp = adjcell.bottom.adjacent.left;
                    if (cell.qans === 4 && temp !== undefined && isEmpty(temp)) {
                        fn(temp, temp.adjacent.bottom, temp.adjacent.left, temp.adjacent.bottom.adjacent.left, 2);
                    }
                    temp = adjcell.bottom.adjacent.right;
                    if (cell.qans === 5 && temp !== undefined && isEmpty(temp)) {
                        fn(temp, temp.adjacent.bottom, temp.adjacent.right, temp.adjacent.bottom.adjacent.right, 3);
                    }
                }
            }
            //2x2 pattern
            {
                let ans_list = [2, 2, 3, 3, 4, 4, 5, 5];
                let fn_list = [[isTopEdge, isBottomEdge], [isRightEdge, isLeftEdge], [isLeftEdge, isRightEdge], [isTopEdge, isBottomEdge],
                [isBottomEdge, isTopEdge], [isLeftEdge, isRightEdge], [isRightEdge, isLeftEdge], [isBottomEdge, isTopEdge]];
                let fn = function (c, c1, c2, c3, c12, c22, dir) {
                    let temp = (!c1.isnull && c1.qsub === 1 && !c2.isnull && isEmpty(c2) && fn_list[dir][0](c3));
                    if (temp && fn_list[dir][1](c12) && (fn_list[dir][1](c22) || (c22.qsub == 1 && isStickEdge(c22)))) {
                        add_triangle(c, ans_list[dir]);
                    }
                };
                if (!adjcell.top.isnull) {
                    fn(cell, adjcell.left, adjcell.top, adjcell.bottom, adjcell.top.adjacent.left, adjcell.top.adjacent.top, 0);
                    fn(cell, adjcell.right, adjcell.top, adjcell.bottom, adjcell.top.adjacent.right, adjcell.top.adjacent.top, 3);
                }
                if (!adjcell.bottom.isnull) {
                    fn(cell, adjcell.left, adjcell.bottom, adjcell.top, adjcell.bottom.adjacent.left, adjcell.bottom.adjacent.bottom, 7);
                    fn(cell, adjcell.right, adjcell.bottom, adjcell.top, adjcell.bottom.adjacent.right, adjcell.bottom.adjacent.bottom, 4);
                }
                if (!adjcell.left.isnull) {
                    fn(cell, adjcell.bottom, adjcell.left, adjcell.right, adjcell.left.adjacent.bottom, adjcell.left.adjacent.left, 2);
                    fn(cell, adjcell.top, adjcell.left, adjcell.right, adjcell.left.adjacent.top, adjcell.left.adjacent.left, 5);
                }
                if (!adjcell.right.isnull) {
                    fn(cell, adjcell.bottom, adjcell.right, adjcell.left, adjcell.right.adjacent.bottom, adjcell.right.adjacent.right, 1);
                    fn(cell, adjcell.top, adjcell.right, adjcell.left, adjcell.right.adjacent.top, adjcell.right.adjacent.right, 6);
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
        let isEmpty = function (c) { return !c.isnull && c.qnum === cqnum.none && c.qans === cqans.light && c.qsub === cqsub.dot; };
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
                        if (isEmpty(dir(adjcell, d)) && isEmpty(dir(adjcell, d + 1)) && isEmpty(dir(dir(adjcell, d).adjacent, d + 1))) {
                            add_dot(dir(dir(adjcell, d).adjacent, d + 1));
                        }
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
            if (cell.ques === cques.blackwall) {
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
                let d = [-1, 0, 2, 3, 1][cell.qdir];
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