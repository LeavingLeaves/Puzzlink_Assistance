const MAXLOOP = 30;
const MAXDFSCELLNUM = 200;

const CQNUM = {
    quesmark: -2,
    circle: -2, // no number
    black: -2,
    none: -1,
    wcir: 1,
    bcir: 2,
};

const CANUM = {
    none: -1,
    // Masyu
    wcir: 1,
    bcir: 2,
};

const CQANS = {
    none: 0,
    black: 1,
    // Light and Shadow
    white: 2,
    // Starbattle
    star: 1,
    // Akari
    light: 1,
    // Shakashaka triangle
    bl: 2,
    br: 3,
    tr: 4,
    tl: 5,
    // Slant
    rslash: 31,
    lslash: 32,
};

const CQUES = {
    none: 0,
    // Castle Wall
    gray: 0,
    white: 1,
    black: 2,
    // Icebarn
    ice: 6,
    // Simpleloop
    bwall: 7,
    // Slalom
    vgate: 21,
    hgate: 22,
    // Nurimaze
    cir: 41,
    tri: 42,
};

const CQSUB = {
    none: 0,
    dot: 1,
    green: 1,
    // Slitherlink
    yellow: 2,
    // All or Nothing
    gray: 1,
};

const QDIR = {
    none: 0,
    // arrow
    up: 1,
    dn: 2,
    lt: 3,
    rt: 4,
};

const BQSUB = {
    none: 0,
    link: 1,
    cross: 2,
    // Icebarn
    arrow_up: 11,
    arrow_dn: 12,
    arrow_lt: 13,
    arrow_rt: 14,
};

const genrelist = [
    [/(lightup|akari)/, AkariAssist],
    [/nothing/, AllorNothingAssist],
    [/aqre/, AqreAssist],
    [/aquapelago/, AquapelagoAssist],
    [/castle/, CastleWallAssist],
    [/(cave|bag)/, CaveAssist],
    [/cbanana/, ChocoBananaAssist],
    [/ayeheya/, EkawayehAssist],
    [/guidearrow/, GuideArrowAssist],
    [/heyawake/, HeyawakeAssist],
    [/hitori/, HitoriAssist],
    [/icebarn/, IcebarnAssist],
    [/kurodoko/, KurodokoAssist],
    [/lightshadow/, LightandShadowAssist],
    [/lits/, LitsAssist],
    [/mas[yh]u/, MasyuAssist],
    [/norinori/, NorinoriAssist],
    [/nothree/, NothreeAssist],
    [/nurikabe/, NurikabeAssist],
    [/nurimaze/, NuriMazeAssist],
    [/nurimisaki/, NurimisakiAssist],
    [/shakashaka/, ShakashakaAssist],
    [/simpleloop/, SimpleloopAssist],
    [/slalom/, SlalomAssist],
    [/gokigen/, SlantAssist],
    [/slither(link)?(_play)?/, SlitherlinkAssist],
    [/starbattle/, StarbattleAssist],
    [/tapa/, TapaAssist],
    [/tentaisho/, TentaishoAssist]
    [/yaji[lr]in/, YajilinAssist],
    [/yinyang/, YinyangAssist],
];
//TODO: Pencils, Fillomino, Square Jam, Country Road
