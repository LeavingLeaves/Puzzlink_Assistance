let GENRENAME = "";
let flg = true;
let step = false;
let board;

window.addEventListener('load', function () {
    GENRENAME = this.window.ui.puzzle.info.en;
    board = this.window.ui.puzzle.board;
    if (genrelist.some(g => g[0] === GENRENAME)) {
        let btn = '<button type="button" class="btn" id="assist" style="display: inline;">Assist</button>';
        let btn2 = '<button type="button" class="btn" id="assiststep" style="display: inline;">Assist Step</button>';
        document.querySelector('#btntrial').insertAdjacentHTML('afterend', btn);
        document.querySelector("#assist").insertAdjacentHTML('afterend', btn2);
        document.querySelector("#assist").addEventListener("click", assist, false);
        document.querySelector("#assiststep").addEventListener("click", assiststep, false);
        window.addEventListener("keypress", (event) => {
            if (event.key === 'q' || (event.key === 'Q')) { assist(); }
            if (event.key === 'w' || (event.key === 'W')) { assiststep(); }
        });
    }
}, false);

function assiststep() {
    step = true;
    assist();
    step = false;
}

function assist() {
    flg = true;
    for (let loop = 0; loop < (step ? 1 : MAXLOOP); loop++) {
        if (!flg) { break; }
        flg = false;
        genrelist.find(g => g[0] === GENRENAME)[1]();
    }
    ui.puzzle.redraw();
    console.log('Assisted.');
}