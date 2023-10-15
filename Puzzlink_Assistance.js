// ==UserScript==
// @name         Puzz.link Assistance
// @version      23.10.15.2
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
    let board;

    let btn = '<button type="button" class="btn" id="assist" style="display: inline;">Assist</button>';
    document.querySelector('#btntrial').insertAdjacentHTML('afterend', btn);
    document.querySelector("#assist").addEventListener("click", assist, false);
    window.addEventListener("keypress", (event) => {
        if (event.key !== 'q') { return; }
        assist();
    });

    function assist() {
        flg = true;
        board = ui.puzzle.board;
        for (let loop = 0; loop < maxLoop; loop++) {
            if (!flg) { break; }
            flg = false;
            if (/slither/.test(document.URL)) { SlitherlinkAssist(); }
            if (/yaji[lr]in/.test(document.URL)) { YajilinAssist(); }
            if (/simpleloop/.test(document.URL)) { SimpleloopAssist(); }
            if (/mas[yh]u/.test(document.URL)) { MasyuAssist(); }
            if (/lightup|akari/.test(document.URL)) { AkariAssist(); }
            if (/heyawake/.test(document.URL)) { HeyawakeAssist(); }
            if (/shakashaka/.test(document.URL)) { ShakashakaAssist(); }
            if (/ayeheya/.test(document.URL)) { EkawayehAssist(); }
        }
        console.log('Assisted.');
    }
    let offset = function (c, dx, dy) {
        return board.getc(c.bx + dx * 2, c.by + dy * 2);
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
    let add_cross = function (d) {
        if (d === undefined || d.isnull || d.line === 1 || d.qsub === 2) { return; }
        flg = 1;
        d.setQsub(2);
        d.draw();
    };
    let add_line = function (d) {
        if (d === undefined || d.isnull || d.qsub === 2 || d.line === 1) { return; }
        flg = 1;
        d.setLine(1);
        d.draw();
    };
    let add_block = function (c) {
        if (c === undefined || c.isnull || c.qnum !== -1 || c.lcnt !== 0 || c.qsub === 1 || c.qans === 1) { return; }
        flg = 1;
        c.setQans(1);
        c.draw();
    };
    let add_light = add_block;
    let add_block2 = function (c) {
        if (c === undefined || c.isnull || c.lcnt !== 0 || c.qsub === 1 || c.qans === 1) { return; }
        flg = 1;
        c.setQans(1);
        c.draw();
    };
    let add_dot = function (c) {
        if (c === undefined || c.isnull || c.qnum !== -1 || c.qans !== 0 || c.qsub === 1) { return; }
        flg = 1;
        c.setQsub(1);
        c.draw();
    };
    let add_green = function (c) {
        if (c === undefined || c.isnull || c.qans !== 0 || c.qsub === 1) { return; }
        flg = 1;
        c.setQsub(1);
        c.draw();
    };
    let add_bg_color = function (c, color) {
        if (c === undefined || c.isnull || c.qsub !== 0 || c.qsub === color) { return; }
        flg = 1;
        c.setQsub(color);
        c.draw();
    }
    let add_bg_inner_color = function (c) {
        add_bg_color(c, 1);
    }
    let add_bg_outer_color = function (c) {
        add_bg_color(c, 2);
    }

    let dir = function (c, ndir) {
        ndir = (ndir % 4 + 4) % 4;
        if (ndir === 1) return c.top;
        if (ndir === 2) return c.right;
        if (ndir === 3) return c.bottom;
        if (ndir === 0) return c.left;
    }

    function SingleLoopInCell(inPath) {
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            let emptynum = 0;
            let linenum = 0;
            let adjcell = cell.adjacent;
            let adjline = cell.adjborder;
            let fn = function (c, d) {
                if (!c.isnull && d.qsub !== 2) { emptynum++; }
                linenum += d.line === 1;
            };
            fourside2(fn, adjcell, adjline);
            //no branch
            if (linenum === 2) {
                fourside(add_cross, adjline);
            }
            //no deadend
            if (emptynum === 1) {
                fourside(add_cross, adjline);
            }
            //2 degree path
            if (emptynum === 2 && (linenum === 1 || cell.qsub === 1 || inPath)) {
                fourside(add_line, adjline);
            }
        }
        //avoid forming multiple loop
        for (let i = 0; i < board.border.length; i++) {
            let border = board.border[i];
            if (border.qsub !== 0) { continue; }
            if (border.line !== 0) { continue; }
            let cr1 = border.sidecell[0];
            let cr2 = border.sidecell[1];
            if (cr1.path !== null && cr1.path === cr2.path && board.linegraph.components.length > 1) {
                add_cross(border);
            }
        }
    }

    function GreenConnectedInCell() {
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            if (cell.qans === 1 || cell.qsub === 1) { continue; }
            let fn = function (c, list) {
                if (c.isnull) {
                    if (list.indexOf(-1) === -1) {
                        list.push(-1);
                    }
                    return;
                }
                if (c.qans !== 1) { return; }
                if (list.indexOf(c.id) !== -1) { return; }
                list.push(c.id);
                fn(offset(c, -1, -1), list);
                fn(offset(c, -1, +1), list);
                fn(offset(c, +1, -1), list);
                fn(offset(c, +1, +1), list);
            }
            let list1 = [], list2 = [], list3 = [], list4 = [];
            if (!offset(cell, -1, -1).isnull) { fn(offset(cell, -1, -1), list1); }
            if (!offset(cell, -1, +1).isnull) { fn(offset(cell, -1, +1), list2); }
            if (!offset(cell, +1, -1).isnull) { fn(offset(cell, +1, -1), list3); }
            if (!offset(cell, +1, +1).isnull) { fn(offset(cell, +1, +1), list4); }
            let templist = [-1, offset(cell, -1, -1).id, offset(cell, -1, +1).id, offset(cell, +1, -1).id, offset(cell, +1, +1).id]
            let list = [].concat(list1, list2, list3, list4);
            if (cell.bx - 1 === board.minbx || cell.bx + 1 === board.maxbx || cell.by - 1 === board.minby || cell.by + 1 === board.maxby) {
                list.push(-1);
            }
            for (let j = 0; j < templist.length; j++) {
                if (list.filter(id => id === templist[j]).length > 1) {
                    add_green(cell);
                    break;
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
                    add_block2(board.getc(tx / 2, ty / 2));
                }
            }
            for (let j = 0; j < room.clist.length; j++) {
                let cell = room.clist[j];
                if (cell.qsub === 1) {
                    add_green(board.getc(tx - cell.bx, ty - cell.by));
                }
                if (cell.qans === 1) {
                    add_block2(board.getc(tx - cell.bx, ty - cell.by));
                }
            }
        }
    }

    function ShakashakaAssist() {
        let isEmpty = function (c) { return !c.isnull && c.qnum === -1 && c.qsub === 0 && c.qans === 0; };
        //draw triangle
        let add_triangle = function (c, ans) {
            if (c === undefined || c.isnull || !isEmpty(c)) { return; }
            flg = 1;
            c.setQans(ans);
            c.draw();
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
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            let adjcell = cell.adjacent;
            let blocknum = 0;
            //green around block
            if (cell.qans === 1) {
                fourside(add_green, adjcell);
                continue;
            }
            let fn = function (c) {
                blocknum += c.isnull || c.qans === 1;
            };
            fourside(fn, adjcell);
            //green escape
            if (cell.qans !== 1 && blocknum === 3) {
                fourside(add_green, adjcell);
            }
            //no two facing doors
            for (let d = 0; d < 4; d++) {
                if (cell.qsub !== 1) { break; }
                let pcell = dir(cell.adjacent, d);
                let bordernum = 0;
                let emptynum = 0;
                let emptycell = pcell;
                while (!pcell.isnull && pcell.qans !== 1 && emptynum <= 1 && bordernum < 2) {
                    if (pcell.qsub !== 1) {
                        emptynum++;
                        emptycell = pcell;
                    }
                    if (dir(pcell.adjborder, d + 2).ques === 1) {
                        bordernum++;
                    }
                    pcell = dir(pcell.adjacent, d);
                }
                if (bordernum === 2 && emptynum === 1) {
                    add_block2(emptycell);
                }
            }
        }
        for (let i = 0; i < board.roommgr.components.length; i++) {
            let room = board.roommgr.components[i];
            if (room.top.qnum === -1) { continue; }
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
                blocknum += cell.qans === 1;
                emptynum += cell.qans !== 1 && cell.qsub !== 1;
                if (cell.qans !== 1 && cell.qsub !== 1 && (cell.bx + cell.by) % 4 === 2) {
                    oddcellList.push(cell);
                }
                if (cell.qans !== 1 && cell.qsub !== 1 && (cell.bx + cell.by) % 4 === 0) {
                    evencellList.push(cell);
                }
                if (cell.qans !== 1 && cell.qsub !== 1) {
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
                    add_block2(room.clist[j]);
                }
            }
            //4 in 3*3
            if (maxx - minx === 4 && maxy - miny === 4 && blocknum + 4 === room.top.qnum) {
                let ccell = board.getc(minx + 2, miny + 2)
                add_green(offset(ccell, 0, -1));
                add_green(offset(ccell, 0, +1));
                add_green(offset(ccell, -1, 0));
                add_green(offset(ccell, +1, 0));
                let fn = function (c) { return c.isnull || c.qans === 1; }
                if (fn(offset(ccell, +2, 0)) || fn(offset(ccell, 0, +2))) { add_block2(offset(ccell, -1, -1)); }
                if (fn(offset(ccell, +2, 0)) || fn(offset(ccell, 0, -2))) { add_block2(offset(ccell, -1, +1)); }
                if (fn(offset(ccell, -2, 0)) || fn(offset(ccell, 0, +2))) { add_block2(offset(ccell, +1, -1)); }
                if (fn(offset(ccell, -2, 0)) || fn(offset(ccell, 0, -2))) { add_block2(offset(ccell, +1, +1)); }
            }
            //2 in 2*2 at corner
            if (maxx - minx === 2 && maxy - miny === 2 && blocknum + 2 === room.top.qnum) {
                if (minx - 1 === board.minbx && miny - 1 === board.minby || maxx + 1 === board.maxbx && maxy + 1 === board.maxby) {
                    add_block2(board.getc(minx, miny));
                    add_block2(board.getc(maxx, maxy));
                }
                if (minx - 1 === board.minbx && maxy + 1 === board.maxby || maxx + 1 === board.maxbx && miny - 1 === board.minby) {
                    add_block2(board.getc(minx + 2, miny));
                    add_block2(board.getc(minx, miny + 2));
                }
            }
            //3 in 2*3 at side
            if ((maxx - minx === 4 && maxy - miny === 2 || maxx - minx === 2 && maxy - miny === 4) && blocknum + 3 === room.top.qnum) {
                if (maxx - 3 === board.minbx || maxy - 3 === board.minby) {
                    add_block2(board.getc(minx, miny + 2));
                    add_block2(board.getc(minx + 2, miny));
                }
                if (minx + 3 === board.maxbx || miny + 3 == board.maxby) {
                    add_block2(board.getc(maxx, maxy - 2));
                    add_block2(board.getc(maxx - 2, maxy));
                }
            }
            let connectedcellList = [];
            let fn = function (c) {
                if (connectedcellList.indexOf(c.id) !== -1) { return; }
                if (c.isnull || c.qans === 1 || c.qsub === 1) { return; }
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
                    add_block2(oddcellList[j]);
                }
            }
            //add at even
            if (blocknum + evencellList.length === room.top.qnum && evencellList.length > oddcellList.length) {
                for (let j = 0; j < evencellList.length; j++) {
                    add_block2(evencellList[j]);
                }
            }
        }
        GreenConnectedInCell();
    }

    function AkariAssist() {
        let isEmpty = function (c) { return !c.isnull && c.qnum === -1 && c.qans === 0 && c.qsub === 0; };
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            let adjcell = cell.adjacent;
            let emptynum = 0;
            let lightnum = 0;
            //add dot where lighted
            if (cell.qlight === 1 && cell.qans !== 1) {
                add_dot(cell);
            }
            //only one place can light
            if (cell.qnum === -1 && cell.qlight === 0) {
                let emptynum = (cell.qsub === 0 ? 1 : 0);
                let emptycell = cell;
                for (let d = 0; d < 4; d++) {
                    let pcell = dir(cell.adjacent, d);
                    while (!pcell.isnull && pcell.qnum === -1) {
                        if (pcell.qsub === 0) {
                            emptynum++;
                            emptycell = pcell;
                        }
                        pcell = dir(pcell.adjacent, d);
                    }
                }
                if (emptynum === 1) {
                    add_light(emptycell);
                }
            }
            let fn = function (c) {
                if (!c.isnull && c.qnum === -1 && c.qsub === 0 && c.qans !== 1) { emptynum++; }
                lightnum += (c.qans === 1);
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
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            let adjcell = cell.adjacent;
            let adjline = cell.adjborder;
            {
                for (let d = 0; d < 4; d++) {
                    if (dir(adjcell, d + 1).qnum === 2 && dir(adjcell, d + 3).qnum === 2 && (dir(adjline, d + 2).isnull || dir(adjline, d + 2).qsub === 2)) {
                        add_cross(dir(adjline, d));
                    }
                }
            }
            if (cell.qnum === 1) {//white
                for (let d = 0; d < 4; d++) {
                    //go straight
                    if (dir(adjline, d).line === 1 || dir(adjline, d + 1).qsub === 2 || dir(adjline, d + 1).isnull) {
                        add_line(dir(adjline, d));
                        add_line(dir(adjline, d + 2));
                        add_cross(dir(adjline, d + 1));
                        add_cross(dir(adjline, d + 3));
                    }
                    //turn at one side
                    if (dir(adjline, d).line === 1 && dir(dir(adjcell, d).adjborder, d).line === 1) {
                        add_cross(dir(dir(adjcell, d + 2).adjborder, d + 2));
                    }
                    //no turn on both side
                    if ((!dir(adjcell, d).isnull && (dir(dir(adjcell, d).adjborder, d).line === 1 ||
                        dir(dir(adjcell, d).adjborder, d + 1).qsub === 2 && dir(dir(adjcell, d).adjborder, d + 3).qsub === 2
                    ) || dir(adjcell, d).qnum === 1) &&
                        (!dir(adjcell, d + 2).isnull && (dir(dir(adjcell, d + 2).adjborder, d + 2).line === 1 ||
                            dir(dir(adjcell, d + 2).adjborder, d + 1).qsub === 2 && dir(dir(adjcell, d + 2).adjborder, d + 3).qsub === 2
                        ) || dir(adjcell, d + 2).qnum === 1)) {
                        add_line(dir(adjline, d + 1));
                        add_line(dir(adjline, d + 3));
                        add_cross(dir(adjline, d));
                        add_cross(dir(adjline, d + 2));
                    }
                }
            }
            if (cell.qnum === 2) {//black
                for (let d = 0; d < 4; d++) {
                    //can't go straight this way
                    if (dir(adjcell, d).isnull || dir(adjline, d).qsub === 2 ||
                        dir(dir(adjcell, d).adjacent, d).isnull || dir(dir(adjcell, d).adjborder, d).qsub === 2 ||
                        dir(adjcell, d).qnum === 2 || dir(adjline, d + 2).line === 1) {
                        add_cross(dir(adjline, d));
                        add_line(dir(adjline, d + 2));
                    }
                    //going straight this way will branch
                    if (dir(adjcell, d).isnull || dir(dir(adjcell, d).adjborder, d + 1).line === 1 ||
                        dir(dir(adjcell, d).adjborder, d + 3).line === 1) {
                        add_cross(dir(adjline, d));
                        add_line(dir(adjline, d + 2));
                    }
                    //go straight
                    if (dir(adjline, d).line === 1) {
                        add_line(dir(dir(adjcell, d).adjborder, d));
                    }
                }
            }
        }
        SingleLoopInCell(0);
    }

    function SimpleloopAssist() {
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            let adjline = cell.adjborder;
            if (cell.ques === 7) {//7 for black block
                fourside(add_cross, adjline);
            }
        }
        SingleLoopInCell(1);
    }

    function YajilinAssist() {
        let isPathable = function (c) { return !c.isnull && c.qnum === -1 && c.qans === 0; };
        let isEmpty = function (c) { return !c.isnull && c.qnum === -1 && c.qans === 0 && c.qsub === 0 && c.lcnt === 0; };
        for (let i = 0; i < board.cell.length; i++) {
            let cell = board.cell[i];
            let emptynum = 0;
            let linenum = 0;
            let adjcell = cell.adjacent;
            let adjline = cell.adjborder;
            //check clue
            if (cell.qnum >= 0 && cell.qdir !== 0) {
                let d = [-1, 1, 3, 0, 2][cell.qdir];
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
                    blocknum += pcell.qans === 1;
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
                    addcellList.forEach(cell => { add_block(cell); });
                }
                //finished clue
                if (blocknum === cell.qnum) {
                    emptycellList.forEach(cell => { add_dot(cell); });
                }
            }
            //add cross
            if (cell.qnum !== -1) {
                fourside(add_cross, adjline);
                continue;
            }
            //add dot around block
            if (cell.qans === 1) {
                fourside(add_cross, adjline);
                fourside(add_dot, adjcell);
                continue;
            }
            let fn = function (c, d) {
                if (isPathable(c) && d.qsub !== 2) { emptynum++; }
                linenum += d.line === 1;
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
                let fn = function (c, d) {
                    if (!isPathable(c) || d.qsub === 2) { return; }
                    add_dot(c);
                };
                fourside2(fn, adjcell, adjline);
            }
        }
        SingleLoopInCell(0);
    }

    function SlitherlinkAssist() {
        ui.toolarea.outlineshaded();
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
            let fn = function (d) {
                if (d.qsub === 0) { emptynum++; }
                linenum += (d.line === 1);
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
            if (cell.qnum === 3 && !adjcell.bottom.isnull && adjcell.bottom.qnum === 3 && ui.puzzle.board.linegraph.components.length > 0) {
                add_line(cell.adjborder.top);
                add_line(cell.adjborder.bottom);
                add_line(adjcell.bottom.adjborder.bottom);
                if (!adjcell.left.isnull) { add_cross(adjcell.left.adjborder.bottom); }
                if (!adjcell.right.isnull) { add_cross(adjcell.right.adjborder.bottom); }
            }
            // horizontal 3s
            if (cell.qnum === 3 && !adjcell.right.isnull && adjcell.right.qnum === 3 && ui.puzzle.board.linegraph.components.length > 0) {
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
            let fn = function (d) {
                if (d !== undefined && !d.isnull && d.qsub === 0) { emptynum++; }
                linenum += (d.line === 1);
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
                let fn = function (c1, c2, c3, c4, c5, c6, c34) {
                    if (c34.isnull) { return; }
                    //avoid 1*1 loop with 2 degree turn
                    if ((c1.isnull || c1.qsub === 2) && (c2.isnull || c2.qsub === 2) && c5.line === 1 && c6.line === 1) {
                        add_cross(c3);
                        add_cross(c4);
                    }
                    //line enters 1
                    if (!c1.isnull && c1.line === 1 && (c2.isnull || c2.qsub === 2) && c34.qnum === 1) {
                        add_cross(c5);
                        add_cross(c6);
                    }
                    //2 degree turn with 2
                    if ((c1.isnull || c1.qsub === 2) && (c2.isnull || c2.qsub === 2) && (c5.qsub === 2 || c6.qsub === 2) && c34.qnum === 2) {
                        add_line(c3);
                        add_line(c4);
                        add_cross(c5);
                        add_cross(c6);
                    }
                    if ((c1.isnull || c1.qsub === 2) && (c2.isnull || c2.qsub === 2) && (c5.line === 1 || c6.line === 1) && c34.qnum === 2) {
                        add_cross(c3);
                        add_cross(c4);
                        add_line(c5);
                        add_line(c6);
                    }
                    //line enters 3
                    if (!c1.isnull && c1.line === 1 && c34.qnum === 3) {
                        add_cross(c2);
                        add_line(c5);
                        add_line(c6);
                    }
                    //line exit 1
                    if ((c2.isnull || c2.qsub === 2) && c34.qnum === 1 && c5.qsub === 2 && c6.qsub === 2) {
                        add_line(c1);
                    }
                    //line exit 2
                    if ((c2.isnull || c2.qsub === 2) && c34.qnum === 2 && (c5.qsub === 2 && c6.line === 1 || c6.qsub === 2 && c5.line === 1)) {
                        add_line(c1);
                    }
                    //line exit 3
                    if ((c2.isnull || c2.qsub === 2) && c34.qnum === 3 && c5.line === 1 && c6.line === 1) {
                        add_line(c1);
                    }
                    //line should enter 1
                    if (c1.line === 1 && c34.qnum === 1 && c5.qsub === 2 && c6.qsub === 2) {
                        add_cross(c2);
                    }
                    //line should enter 2
                    if (c1.line === 1 && c34.qnum === 2 && (c5.qsub === 2 || c6.qsub === 2)) {
                        add_cross(c2);
                        add_line(c5);
                        add_line(c6);
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
            if (border.qsub !== 0) { continue; }
            if (border.line !== 0) { continue; }
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
                    if (!c.isnull && cell.qsub !== 0 && cell.qsub === c.qsub) {
                        add_cross(d);
                    }
                    if (cell.qsub === 2 && c.isnull) {
                        add_cross(d);
                    }
                };
                fourside2(fn, adjcell, adjline);
            }
            //deduce neighbor color
            if (cell.qsub === 0) {
                let fn = function (cn, dn) {
                    if (dn.line === 1 && cn.isnull) {
                        add_bg_inner_color(cell);
                    }
                    if (dn.qsub === 2 && cn.isnull) {
                        add_bg_outer_color(cell);
                    }
                    if (dn.line === 1 && !cn.isnull && cn.qsub !== 0) {
                        add_bg_color(cell, 3 - cn.qsub);
                    }
                    if (dn.qsub === 2 && !cn.isnull && cn.qsub !== 0) {
                        add_bg_color(cell, cn.qsub);
                    }
                };
                fourside2(fn, adjcell, adjline);
            }
            //checker pattern
            if (cell.qsub === 0) {
                let fn = function (c, c1, c2, c12) {
                    if (c1.isnull || c2.isnull || c12.isnull) { return; }
                    if (c1.qsub === 0 || c2.qsub === 0 || c12.qsub === 0) { return; }
                    if (c1.qsub === c2.qsub && c1.qsub !== c12.qsub) {
                        add_bg_color(c, c1.qsub);
                    }
                };
                fn(cell, adjcell.top, adjcell.left, adjcell.top.adjacent.left);
                fn(cell, adjcell.top, adjcell.right, adjcell.top.adjacent.right);
                fn(cell, adjcell.bottom, adjcell.left, adjcell.bottom.adjacent.left);
                fn(cell, adjcell.bottom, adjcell.right, adjcell.bottom.adjacent.right);
            }
            //number and color deduce
            if (cell.qnum >= 0) {
                let innernum = 0;
                let outernum = 0;
                let fn = function (c) {
                    if (!c.isnull && c.qsub === 1) { innernum++; }
                    if (c.isnull || c.qsub === 2) { outernum++; }
                };
                fourside(fn, adjcell);
                if (cell.qnum < innernum || 4 - cell.qnum < outernum) {
                    add_bg_inner_color(cell);
                }
                if (cell.qnum < outernum || 4 - cell.qnum < innernum) {
                    add_bg_outer_color(cell);
                }
                if (cell.qsub === 1 && cell.qnum === outernum) {
                    fourside(add_bg_inner_color, adjcell);
                }
                if (cell.qsub === 2 && cell.qnum === innernum) {
                    fourside(add_bg_outer_color, adjcell);
                }
                if (cell.qsub === 2 && cell.qnum === 4 - outernum) {
                    fourside(add_bg_inner_color, adjcell);
                }
                if (cell.qsub === 1 && cell.qnum === 4 - innernum) {
                    fourside(add_bg_outer_color, adjcell);
                }
                if (cell.qnum === 2 && outernum === 2) {
                    fourside(add_bg_inner_color, adjcell);
                }
                if (cell.qnum === 2 && innernum === 2) {
                    fourside(add_bg_outer_color, adjcell);
                }
                //2 different color around 1 or 3
                {
                    let fn = function (c, d) {
                        if (!c.isnull && c.qsub === 0) {
                            if (cell.qnum === 1) { add_cross(d); }
                            if (cell.qnum === 3) { add_line(d); }
                        }
                    };
                    if ((cell.qnum === 1 || cell.qnum === 3) && innernum === 1 && outernum === 1) {
                        fourside2(fn, adjcell, adjline);
                    }
                }
                //same diagonal color as 3
                if (cell.qnum === 3 && cell.qsub !== 0) {
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