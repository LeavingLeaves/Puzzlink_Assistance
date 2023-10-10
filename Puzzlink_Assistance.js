// ==UserScript==
// @name         Puzz.link Assistance
// @version      1.0
// @description  Do trivial deduction.
// @author       Leaving Leaves
// @match        https://puzz.link/p?*slither*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const maxLoop=20;

    var btn = '<button type="button" class="btn" id="assist" style="display: inline;">Assist</button>';
    document.querySelector('#btntrial').insertAdjacentHTML('afterend', btn);

    document.querySelector("#assist").addEventListener("click", assist, false);

    window.addEventListener("keypress", (event) => {
        if (event.key !== 'q') { return; }
        assist();
    });

    function assist() {
        if (/slither/.test(document.URL)) { SlitherlinkAssist(); }
    }

    function SlitherlinkAssist() {
        let board = ui.puzzle.board;
        let cell = board.cell;
        let cross = board.cross;
        let flg = true;
        let addline = function (c) {
            if (c === undefined || c.id === null || c.qsub === 2) { return; }
            flg |= (c.line !== 1);
            c.setLine();
            c.draw();
        };
        let addcross = function (c) {
            if (c === undefined || c.id === null || c.line === 1) { return; }
            flg |= (c.qsub !== 2);
            c.setQsub(2);
            c.draw();
        };
        let fourside = function (a, b) {
            a(b.top);
            a(b.bottom);
            a(b.left);
            a(b.right);
        };
        for (let loop = 0; loop < maxLoop; loop++) {
            if (!flg) { break; }
            flg = false;
            for (let i = 0; i < cell.length; i++) {
                let adj = cell[i].adjborder;
                let emptynum = 0;
                let linenum = 0;
                if (cell[i].qnum === 0) {
                    fourside(addcross, adj);
                }
                let fn = function (c) { 
                    if (c.qsub === 0) { emptynum++; } 
                    linenum += (c.line == 1); 
                };
                fourside(fn, adj);
                if (emptynum === cell[i].qnum) {
                    fourside(addline, adj);
                }
                if (linenum === cell[i].qnum) {
                    fourside(addcross, adj);
                }
                if (cell[i].qnum === 3 && cell[i].adjacent.bottom !== undefined && cell[i].adjacent.bottom.qnum === 3) {
                    addline(cell[i].adjborder.top);
                    addline(cell[i].adjborder.bottom);
                    addline(cell[i].adjacent.bottom.adjborder.bottom);
                    if (cell[i].adjacent.left !== undefined) { addcross(cell[i].adjacent.left.adjborder.bottom); }
                    if (cell[i].adjacent.right !== undefined) { addcross(cell[i].adjacent.right.adjborder.bottom); }
                }
                if (cell[i].qnum === 3 && cell[i].adjacent.right !== undefined && cell[i].adjacent.right.qnum === 3) {
                    addline(cell[i].adjborder.left);
                    addline(cell[i].adjborder.right);
                    addline(cell[i].adjacent.right.adjborder.right);
                    if (cell[i].adjacent.top !== undefined) { addcross(cell[i].adjacent.top.adjborder.right); }
                    if (cell[i].adjacent.bottom !== undefined) { addcross(cell[i].adjacent.bottom.adjborder.right); }
                }
                if (cell[i].qnum === 3 && cell[i].adjacent.bottom !== undefined && cell[i].adjacent.bottom.adjacent.left !== undefined && cell[i].adjacent.bottom.adjacent.left.qnum === 3) {
                    let cell2 = cell[i].adjacent.bottom.adjacent.left;
                    addline(cell[i].adjborder.top);
                    addline(cell[i].adjborder.right);
                    addline(cell2.adjborder.bottom);
                    addline(cell2.adjborder.left);
                }
                if (cell[i].qnum === 3 && cell[i].adjacent.bottom !== undefined && cell[i].adjacent.bottom.adjacent.right !== undefined && cell[i].adjacent.bottom.adjacent.right.qnum === 3) {
                    let cell2 = cell[i].adjacent.bottom.adjacent.right;
                    addline(cell[i].adjborder.top);
                    addline(cell[i].adjborder.left);
                    addline(cell2.adjborder.bottom);
                    addline(cell2.adjborder.right);
                }
            }

            for (let i = 0; i < cross.length; i++) {
                let adj = cross[i].adjborder;
                let emptynum = 0;
                let linenum = 0;
                let fn = function (c) { if (c !== undefined && c.id !== null && c.qsub === 0) { emptynum++; } linenum += (c.line == 1); };
                fourside(fn, adj);
                if (emptynum === 1 || linenum === 2) {
                    fourside(addcross, adj);
                } else
                    if (emptynum === 2 && linenum === 1) {
                        fourside(addline, adj);
                    } else
                        if (emptynum === 2 && linenum === 0) {
                            let fn = function (c) { return c !== undefined && c.id !== null && c.qsub === 0; }
                            if (fn(adj.top) && fn(adj.left) && adj.top.sidecell[0].qnum === 3) { fourside(addline, adj); }
                            if (fn(adj.top) && fn(adj.right) && adj.top.sidecell[1].qnum === 3) { fourside(addline, adj); }
                            if (fn(adj.bottom) && fn(adj.left) && adj.bottom.sidecell[0].qnum === 3) { fourside(addline, adj); }
                            if (fn(adj.bottom) && fn(adj.right) && adj.bottom.sidecell[1].qnum === 3) { fourside(addline, adj); }

                            if (fn(adj.top) && fn(adj.left) && adj.top.sidecell[0].qnum === 1) { fourside(addcross, adj); }
                            if (fn(adj.top) && fn(adj.right) && adj.top.sidecell[1].qnum === 1) { fourside(addcross, adj); }
                            if (fn(adj.bottom) && fn(adj.left) && adj.bottom.sidecell[0].qnum === 1) { fourside(addcross, adj); }
                            if (fn(adj.bottom) && fn(adj.right) && adj.bottom.sidecell[1].qnum === 1) { fourside(addcross, adj); }
                        }
            }
        }
        console.log('Assisted.');
    }

})();